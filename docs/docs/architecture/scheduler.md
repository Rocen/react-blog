## Scheduler（调度器）

`Scheduler`是新版本`React`新增的架构，从名字就可以看出它的功能主要就是”调度“。  
而`Scheduler`主要包含两个功能：
1. 时间切片
2. 优先级调度

在理念这一节中介绍了，有两种场景会制约快速响应，其中之一是CPU的瓶颈会造成页面卡顿。所以为了解决CPU瓶颈造成的问题，就要使用时间切片这一特性。而实现时间切片的关键在于，浏览器是否有剩余时间作为任务中断的标准，那么我们需要一种机制，当浏览器有剩余时间时通知我们。
虽然目前已经有了这样一个原生API：[requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)。但由于以下限制，`React`并没有直接使用这个API。  
+ 浏览器兼容性
+ 触发频率不稳定，比如在浏览器中切换Tab页后，之前注册的`requestIdleCallback`触发频率就会变低

基于以上的原因，`React`实现了功能更完备的`requestIdleCallback`的*polyfill*实现，这就是`Scheduler`。所以`Scheduler`最大的作用就是实现**时间切片**。

## 时间切片原理

时间切片的本质就是模拟实现`requestIdleCallback`。  

所以`Scheduler`将要使用的回调函数作为[Message Channel](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel)的回调函数执行。如果宿主环境不支持`Message Channel`，则会降级使用`setTimeout`。在此可以看出，`Scheduler`的时间切片功能是通过**宏任务**实现的。而原因是，在一帧当中**宏任务**的执行时机是**最靠前**的，JS任务尽早的执行就可以留出足够的时间去执行页面渲染流水线的工作。  

在`React`的`render`阶段，开启`Concurrent Mode`时，每次`while`遍历时，都会通过`Scheduler`提供的`shouldYield`方法判断是否需要**中断遍历**，使浏览器有足够的时间进行渲染。
```js
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```
是否中断的依据就是每个任务的**剩余时间**是否用完。  

所以，在Scheduler中，为任务分配的初始剩余时间为`5ms`。
```js
function shouldYieldToHost() {
  // getCurrentTime用来获取当前时间
  // deadline表示当前的截止时间
  // 如果当前时间大于等于截止时间，说明已经过了时间切片所预留的时间来执行任务，应该暂停任务的执行，返回true
  // 反之，说明还没过时间切片所预留的时间，可以执行任务，返回false
  return getCurrentTime() >= deadline; 
}
```
在每次进入*时间切片*时，都会进行赋值`deadline = currentTime + yieldInterval`，而这个`yieldInterval`通常为*5ms*，所以每次任务的执行事件都会是多余*5ms*的一小段时间。

## 优先级调度

`Scheduler`对外暴露了一个方法`unstable_runWithPriority`。这个方法接受一个优先级与一个回调函数，在回调函数内部调用获取优先级的方法都会取得第一个参数对应的优先级：
```js
function unstable_runWithPriority(priorityLevel, eventHandler) {
  switch (priorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      break;
    default:
      priorityLevel = NormalPriority;
  }

  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}
```
从这段代码可以看到，`Scheduler`内部存在5种优先级。  

在`React`内部凡是涉及到优先级调度的地方，都会使用`unstable_runWithPriority`。  

比如，`commit`阶段是同步执行的。而`commit`阶段的起点`commitRoot`方法的优先级为`ImmediateSchedulerPriority`。  

`ImmediateSchedulerPriority`即`ImmediatePriority`的别名，为最高优先级，所以会立刻执行。  
```js
function commitRoot(root) {
  const renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(
    ImmediateSchedulerPriority,
    commitRootImpl.bind(null, root, renderPriorityLevel),
  );
  return null;
}
```
## 优先级的意义

`Scheduler`对外暴露的最重要的方法是`unstable_scheduleCallback`。该方法用于以某个优先级注册回调函数。  

比如，在`React`中，在`commit`阶段的`beforeMutation`阶段会调度`useEffect`的回调。
```js
if (!rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = true;
    scheduleCallback(NormalSchedulerPriority, () => {
        flushPassiveEffects();
        return null;
    });
}
```
这里的回调便是通过`scheduleCallback`调度的，优先级为`NormalSchedulerPriority`，即`NormalPriority`。  

不同的优先级意味任务过期时间：
```js
// 立刻过期
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// 最终过期
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// 永不会过期
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;


var timeout; // 延迟时间
switch (priorityLevel) {
  case ImmediatePriority:
    timeout = IMMEDIATE_PRIORITY_TIMEOUT;
    break;
  case UserBlockingPriority:
    timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
    break;
  case IdlePriority:
    timeout = IDLE_PRIORITY_TIMEOUT;
    break;
  case LowPriority:
    timeout = LOW_PRIORITY_TIMEOUT;
    break;
  case NormalPriority:
  default:
    timeout = NORMAL_PRIORITY_TIMEOUT;
    break;
}

var expirationTime = startTime + timeout; // 开始时间和延迟时间相加，等于过期时间
```
从这段代码可以看到，如果一个任务的优先级是`ImmediatePriority`，它对应的`timeout`是 **-1**，通过它计算的过期时间就是**startTime - 1**，说明这个任务马上就过期了，需要立即执行。  
<!-- 相反，如果一个任务的优先级是LowPriority，它对应timeout是10000，通过它计算的过期时间及时startTime + 10000，说明这个任务最多还有10s才会过期。  
需要说明的是，通过timeout计算出来的过期时间并不代表这个任务最终执行的时机。它所量化成的这个过期时间只是决定了多个任务之间的执行顺序。  
比如，当前通过scheduleCallback调度了两个任务，一个任务的优先级是以ImmediatePriority，另一个任务的优先级是NORMAL_PRIORITY_TIMEOUT。因为ImmediatePriority对应的过期时间非常短，所以这个任务一定会立即执行。而NormalPriority对应的过期时间比较长，有5s。但是不表示这个任务一定会在5s之后执行，因为这个时间间隔对于页面交互来说未免太长了些。而当优先级较高的任务执行结束之后，又没有其他高优先级的任务的话，则会提前执行这个低优先级的任务。 -->

## 不同优先级任务的排序

我们已经知道了优先级意味着任务的过期时间。所以当某一时刻，存在很多个不同优先级的任务，每个任务对应着不同的过期时间。  

这些任务会按照过期时间分为两种：
+ **已经过期**的任务
+ **还未过期**的任务

所以，与之对应的，`Scheduler`也存在两个队列
+ timerQueue：保存还未过期任务的队列
+ taskQueue：保存已经过期任务的队列

每当有新的还未过期的任务被注册，会将其插入到`timerQueue`中并根据开始时间重新排序`timerQueue`中任务的顺序。  

而当`timerQueue`中有任务就绪时，即`startTime <= currentTime`，则将这个过期的任务取出再插入到`taskQueue`中。然后，再从`taskQueue`中取出最早过期的任务并执行它。  

为了能在`O(1)`复杂找到两个队列中时间最早的那个任务，`Scheduler`使用*小顶堆*实现了优先级队列。  

至此，我们通过文字叙述的方式大致了解了`Scheduler`的实现。  

## shouldYield

那么当`shouldYield`为`true`时，`performUnitOfWork`被中断后又是如何恢复的呢？  

在执行`taskQueue`中过期任务的方法`workLoop`中有一处关键步骤：
```js
function workLoop(hasTimeRemaining, initialTime) {
    // order code...

    // 取出callback回调函数，这个是使用scheduleCallback方法传入的第二个参数
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      // 先重置callback
      currentTask.callback = null;
      // 设置优先级
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      // 执行callback，并取到执行结果
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      // **重点**
      // 判断执行结果的返回值
      if (typeof continuationCallback === 'function') {
        // 如果返回值依然是一个函数
        // 重新赋值callback属性
        currentTask.callback = continuationCallback;
      } else {
        // 如果返回值不是一个函数，通常为null
        if (currentTask === peek(taskQueue)) {
          // 说明这个任务已经执行完毕了，将这个任务从taskQueue中移除
          pop(taskQueue);
        }
      }
      // 继续从timerQueue中取出过期的任务
      advanceTimers(currentTime);
    } else {
      // 如果callback不是一个函数，则直接从taskQueue中移除这个任务
      pop(taskQueue);
    }

    // order code...
}
```
当注册的回调函数执行后的返回值`continuationCallback`为`function`类型，会将`continuationCallback`再次作为当前任务的回调函数。 

那什么时候执行完函数之后依然会返回一个函数作为结果呢？  

`render`阶段被调度的函数为`performConcurrentWorkOnRoot`，在该函数末尾有这样一段代码：
```js
function performConcurrentWorkOnRoot(root, didTimeout) {
    // order code...

    // originalCallbackNode表示当前正在执行的task
    // root.callbackNode表示根节点正在调度的task
    if (root.callbackNode === originalCallbackNode) {
        // 如果两者相等，说明存在任务中断的情况
        // 因为performConcurrentWorkOnRoot执行结束后，root.callbackNode会被重置为null，而originalCallbackNode一定是有值的，那么两者一定不会相等
        return performConcurrentWorkOnRoot.bind(null, root);
    }
}
```
可以看到，在满足一定条件时，该函数会将自己作为返回值。  

## 暂停到恢复的完整流程

在`Concurrent Mode`模式下，使用*时间切片*的特性时，如果当前正在进行中的任务已经没有剩余时间了，则会暂停当前`render`阶段的`performUnitOfWork`方法。  

暂停的过程对应，通过`scheduleCallback`调度了`performConcurrentWorkOnRoot`方法。然后通过`workLoop`方法遍历`taskQueue`中过期的任务，而这个任务对应的回调函数就是`performConcurrentWorkOnRoot`方法，所以在这时会执行它。在执行`performConcurrentWorkOnRoot`方法时，进入到`workLoopConcurrent`方法中，在`while`循环中会调用`performUnitOfWork`方法递归遍历`Fiber`树。而当时间片用尽时，`shouldYield`方法返回`true`，将停止这个`while`循环，达到了暂停执行的目的。  

恢复的过程对应，因为`performConcurrentWorkOnRoot`方法还没有完成`render`阶段，则根节点还存在正在执行`task`，所以`performConcurrentWorkOnRoot`方法会将自己作为返回值，并重新赋值`task`的`callback`属性。而因为`callback`的执行结果还是一个函数，所以这个`task`会继续存在于taskQueue中，它所对应的过期时间依然是最短的。等到下一轮事件循环，再次调用`workLoop`方法遍历`taskQueue`，取出未完成`task`并执行回调函数，即上次返回的`performConcurrentWorkOnRoot`方法。这个方法会接着执行未完成的`render`阶段，达到了恢复执行的目的。

## 总结

`Scheduler`主要包含两个功能：**时间切片**和**优先级调度**。  

**时间切片**的本质是模拟实现`requestIdleCallback`，目的是防止*阻塞浏览器的渲染*，所以需要通过`时间切片`来控制任务的执行时长。当没有剩余时间时则会**中断**任务的执行，把剩余的时间留给浏览器渲染。等到下一帧再**恢复**任务的执行，重复此过程，直到完成`render`阶段。  

**优先级调度**，`Scheduler`对外暴露了一个`runWithPriority`方法，这个方法接受一个*优先级*与*回调函数*。优先级代表任务**过期时间的长短**。高优先级任务的*过期时间短*，所以会先执行。低优先级任务的*过期时间长*，就会后执行。