## 批量更新

我们知道，当使用触发状态更新的方法时，如：`this.setState`，最终会导致组件的渲染。那么如果使用了多次触发状态更新的方法，组件是否也会渲染多次呢？  

**批量更新**就是用来解决多次状态更新可能会导致多次渲染的问题。**批量更新**会将这些状态更新**合并**到一次状态更新流程，使得组件只进行一次渲染，进而达到性能优化的目的。  

**批量更新**其实属于React底层运行的一种优化特性，并不会被实际感知。  

但是，`React`还是提供了一个顶层的api：`unstable_batchedUpdates`。目的是因为旧版本`React`对于批量更新的实现存在一些问题，导致特定情况下并不能实现**批量更新**的效果，所以`React`又暴露了一个方法来让开发者显式使用在需要**批量更新**的地方。  

## 旧版批量更新
```js
function batchedUpdates<A, R>(fn: A => R, a: A): R {
  const prevExecutionContext = executionContext;
  executionContext |= BatchedContext;
  try {
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;
  }
}
```
这段代码是旧版批量更新的实现方式，代码量是非常少的。那使用这种方式进行批量更新会出现什么问题？  
```js
const func = () => {
    setTimeout(() => {
        this.setState({num: 1})
        this.setState({num: 2})
    })
}
```
如代码所示，当在异步代码中使用`this.setState`等触发状态更新方法的话，就会导致**批量更新**失败。  

原因是因为旧版批量更新采用的是**同步**的写法，而异步回调函数中的代码会在**同步**代码执行结束后再执行。当在异步回调函数中执行`this.setState`时候已经脱离了`batchedUpdates`函数的执行上下文，所以也就无法达到批量更新的效果。   

无法批量更新的结果是，这两个触发状态更新方法分别会各自触发两次状态更新的流程（`render`阶段和`commit`阶段），最终会导致组件渲染两次。

## 新版批量更新
新版批量更新的实现是基于`lane`模型，即优先级。  
```js
// 简化后的代码
function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  // 取到当前root正在执行的任务，即 task
  const existingCallbackNode = root.callbackNode;
  // 取到当前root上最高优先级的lanes
  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
  );
  // 如果没有需要执行的lanes
  if (nextLanes === NoLanes) {
    // 说明当前执行的回调内没有触发状态更新
    if (existingCallbackNode !== null) {
      // 直接取消正在执行的task
      cancelCallback(existingCallbackNode);
    }
    // 重置全局变量，并退出
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    return;
  }
  // 从nextLanes中再取出最高优先级的lane
  const newCallbackPriority = getHighestPriorityLane(nextLanes);
  // 取到root正在执行的 task 的 lane 对应的优先级
  const existingCallbackPriority = root.callbackPriority;
  // **重点**
  // 如果root正在回调的lane对应的优先级等于下一次新回调的lane对应的优先级
  if (
    existingCallbackPriority === newCallbackPriority
  ) {
    // 则直接退出函数
    return;
    // 如果在此处退出函数，则不会调度performConcurrentWorkOnRoot，也就不会再次进入到render阶段和commit阶段
  }
  // 如果没有中途退出，那么新的回调任务的优先级一定比正在进行回调任务的优先级高
  if (existingCallbackNode != null) {
    // 则取消正在调度的任务，也就是**高优先的更新会打断低优先级的更新**
    cancelCallback(existingCallbackNode);
  }

  let newCallbackNode;
  if (newCallbackPriority === SyncLane) {
    // 如果新触发的更新对应的lane是SyncLane则使用同步更新进行更新流程
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    scheduleMicrotask(flushSyncCallbacks);
    newCallbackNode = null;
  } else {
    // 将lane优先级转化scheduler优先级
    let schedulerPriorityLevel;
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }
    // 以scheduler优先级调度performConcurrentWorkOnRoot方法
    // scheduleCallback方法的返回值是一个task
    newCallbackNode = scheduleCallback(
        schedulerPriorityLevel,
        performConcurrentWorkOnRoot.bind(null, root),
    );
  }
  // 赋值
  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}
```
从这段代码可以看到，新版批量更新的实现方式是通过比较前后回调任务的`lane`对应的优先级是否一致。如果一致的话，只有第一个回调任务会开启一次状态更新流程，它之后的所有相同优先级的回调任务都不会开启新的状态更新流程。   

`React`正是通过将**相同**优先级的多个状态更新**合并**到一次状态更新流程的方式实现了新版**批量更新**。  

整个`ensureRootIsScheduled`方法涉及到了两个特性：**批量更新**和**高优先级更新打断低优先级更新**。  

这两个特性都是需要判断前后状态更新的`lane`对应的优先级是否一致。如果优先级*一致*，就对应**批量更新**的特性，后续的状态更新都不会开启新的状态更新流程。而如果优先级*不一致*的话，就对应了**高优先级更新打断低优先级更新**的特性，因为新产生的状态更新的`lane`对应的优先级更高，所以会**打断**正在进行中的状态更新，重新调度一个新的状态更新流程。  

<!-- 比如，在一个点击事件中先后触发了两个更新，先触发了一个defaultLane的更新，后触发了一个SyncLane的更新。当defaultLane率先进入ensureRootIsScheduled方法，调度了一个新的更新流程。然后SyncLane的更新进入了ensureRootIsScheduled方法，它的优先级明高于defaultLane，所以会取消defaultLane正在调度更新流程，然后使用同步的方式调度新的更新流程。 -->
当根节点存在正在进行的更新*u1*，此时又触发了一个状态更新*u2*。那么*u2*对应的优先级相比*u1*的优先级存在三种可能的取值：优先级更低，优先级相等和优先级更高。  

这三种可能分别对应的情况：
1. *u2*的优先级比*u1*优先级更低，那么*u2*并不会干扰*u1*正在进行的更新流程。直到*u1*的整个状态更新流程结束后，才会开始*u2*的状态更新流程。属于最正常的执行情况
2. *u2*的优先级和*u1*的优先级相等，那么*u2*不会干扰*u1*正在进行的更新流程。*u2*会在属于*u1*的状态更新流程中一并进行计算，得到计算结果后进行渲染组件。对应了**批量更新**的特性
3. *u2*的优先级比*u1*的优先级更高，则会中断*u1*正在进行的更新流程，然后开始*u2*的状态更新流程。直到*u2*的整个状态更新流程结束后，再重新开始*u1*的状态更新流程。对应了**高优先级更新打断低优先级更新**的特性

## 清除低优先级更新的执行结果
如果一个低优先级的更新被高优先级的更新打断，但是低优先级更新的更新流程已经进行了一部分，即已经产生了执行结果，这该如何处理呢？
```js
function prepareFreshStack(root: FiberRoot, lanes: Lanes) {
  // 重置变量
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  // workInProgress是一个全局变量，用来保存当前正在构建的fiber即workInProgress fiber
  if (workInProgress !== null) {
    // workInProgress不为空，说明已经完成了部分fiber节点的创建
    // 获取当前Fiber的父级Fiber节点
    let interruptedWork = workInProgress.return;
    // 遍历
    while (interruptedWork !== null) {
      // 清除每个Fiber节点的执行栈记录
      unwindInterruptedWork(interruptedWork, workInProgressRootRenderLanes);
      interruptedWork = interruptedWork.return;
    }
  }
  // 
  workInProgressRoot = root;
  // 重新赋值workInProgress为新创建的rootFiber，这样再次开启更新流程，就会rootFiber作为根节点从头创建Fiber节点
  workInProgress = createWorkInProgress(root.current, null);
  // 重置全局变量等
  workInProgressRootRenderLanes = subtreeRenderLanes = workInProgressRootIncludedLanes = lanes;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;
}
```
因为状态更新流程是包括`render`阶段和`commit`阶段。在`Concurrent Mode`下，只有`render`阶段是可以被**打断**的，`commit`阶段因为是**同步**执行的，所以不可能被打断。`render`阶段的工作是创建`Fiber`节点并形成`Fiber`树，所以只要清空已经创建的`Fiber`节点和`Fiber`树就可以消除被打断的状态更新流程产生的影响。  

## 完整流程
首先，`this.setState`使用的是源码内部定义的`enqueueSetState`方法。
```js
enqueueSetState(inst, payload, callback) {
    // 获取当前组件对应的fiber节点
    const fiber = getInstance(inst);
    // 计算过期时间，通常为当前时间
    const eventTime = requestEventTime();
    // 获取lane，通常取决于调用环境的上下文
    const lane = requestUpdateLane(fiber);
    // 创建update，并为update赋值lane
    const update = createUpdate(eventTime, lane);
    // 赋值payload
    update.payload = payload;
    if (callback !== undefined && callback !== null) {
      // 赋值callback
      update.callback = callback;
    }
    // 将创建的update插入到fiber.updateQeuue中
    enqueueUpdate(fiber, update, lane);
    // 调度更新
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);
  },
```
从这段代码可以看到，触发的状态更新对应的`lane`是通过`requestUpdateLane`方法获取的。  

那这个方法是怎么定义的呢？
```js
export function requestUpdateLane(fiber: Fiber): Lane {
  // Special cases
  const mode = fiber.mode;
  if ((mode & ConcurrentMode) === NoMode) {
    // 如果不是Concurrent mode，直接返回syncLane，说明是同步模式
    return (SyncLane: Lane);
  } else if (
    !deferRenderPhaseUpdateToNextBatch &&
    (executionContext & RenderContext) !== NoContext &&
    workInProgressRootRenderLanes !== NoLanes
  ) {
    // 渲染阶段触发的更新，获取优先级的方式，暂时不需要关注
    return pickArbitraryLane(workInProgressRootRenderLanes);
  }
  // transition相关的处理，暂时不需要关注
  const isTransition = requestCurrentTransition() !== NoTransition;
  if (isTransition) {
    if (currentEventTransitionLane === NoLane) {
      // All transitions within the same event are assigned the same lane.
      currentEventTransitionLane = claimNextTransitionLane();
    }
    return currentEventTransitionLane;
  }
  // 通过getCurrentUpdatePriority方法，返回全局变量currentUpdatePriority
  const updateLane: Lane = (getCurrentUpdatePriority(): any);
  // 如果updateLane有值
  if (updateLane !== NoLane) {
    // 直接返回
    return updateLane;
  }
  // 如果来自React外部定义方法，则需要根据事件类型判断属于的lane
  const eventLane: Lane = (getCurrentEventPriority(): any);
  // 返回
  return eventLane;
}
```
从这段代码可以看到，状态更新对应的`lane`取值通常就是全局变量`currentUpdatePriority`。  

那这个全局变量会在何时被赋值呢？
```js
export const DiscreteEventPriority: EventPriority = SyncLane;

function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent,
) {
  const previousPriority = getCurrentUpdatePriority();
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = 0;
  try {
    // 调用setCurrentUpdatePriority方法，赋值currentUpdatePriority
    // 即currentUpdatePriority = DiscreteEventPriority
    setCurrentUpdatePriority(DiscreteEventPriority);
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}
```
在`dispatchDiscreteEvent`方法中会调用`setCurrentUpdatePriority`方法，将`currentUpdatePriority`赋值为传入的参数，即`DiscreteEventPriority`。  

`dispatchDiscreteEvent`这个方法会被`bind`返回一个新函数，然后在`addTrappedEventListener`方法内使用`addEventBubbleListener`方法绑定（`addEventListener`）到容器（通常为`div#root`）上。  

如果用伪代码表示：
```js
    div#root.addEventListener('click', dispatchDiscreteEvent, false)
```
从此可以看出，每当触发了`click`事件，都会执行`dispatchDiscreteEvent`方法并设置`currentUpdatePriority`为`DiscreteEventPriority`值。这就说明，在以`click`事件注册的同一个回调函数中，以相同方式触发的所有状态更新获取到的`lane`都是一致的，因为它们都属于`DiscreteEventPriority`设置的事件优先级。  
::: tip
需要注意的是，只有以相同方式触发的状态更新才会具有相同的`lane`。
比如：
```js
    const onClick = () => {
        setNum((num) => num + 1);
        setTimeout(() => {
            setNum((num) => num + 2)
        })
    }
```
这段代码里以**同步**方式和**异步**方式分别触发了两个状态更新，但是这两个状态更新并不会被合并成**批量更新**。因为所属的执行上下文不同，所以在函数执行的时候也会被赋予不同的优先级。一般情况下，由用户事件触发的状态更新对应的优先级为`SyncLane`，而异步回调触发的状态更新对应优先级为`defaultLane`。
:::
获取到状态更新各自对应的`lane`后，会进入`scheduleUpdateOnFiber`方法。在`scheduleUpdateOnFiber`的方法中，会调用`markRootUpdated`方法。
```js
 function markRootUpdated(
  root: FiberRoot,
  updateLane: Lane,
  eventTime: number,
) {
  // 将触发的状态更新对应的lane合并到root.pendingLanes中
  // 这样每次在getNextLanes方法中获取root.pendingLanes的值的时候，都能知道根节点都存在哪些正在进行的lane
  root.pendingLanes |= updateLane;

  // order code...
}
```
然后进入`ensureRootIsScheduled`方法。接着执行了`getNextLanes`。
```js
// 简化后的代码
function getNextLanes(root: FiberRoot, wipLanes: Lanes): Lanes {
  // 取到root上正在进行的lanes
  const pendingLanes = root.pendingLanes;
  // 如果没有正在进行的lanes
  if (pendingLanes === NoLanes) {
    // 返回NoLanes
    return NoLanes;
  }
  // 初始化nextLanes
  let nextLanes = NoLanes;

  const suspendedLanes = root.suspendedLanes;
  const pingedLanes = root.pingedLanes;

  // 这段代码的逻辑主要是从非空闲的lanes中取到最高优先级的lanes
  // 将pendingLanes按位与NonIdleLanes。可以获取非空闲的正在进行的lanes
  const nonIdlePendingLanes = pendingLanes & NonIdleLanes;
  // 存在非空闲的正在进行的lanes
  if (nonIdlePendingLanes !== NoLanes) {
    // 将nonIdlePendingLanes按位与非suspendedLanes，可以从nonIdlePendingLanes移除suspendedLanes（与suspend相关的lanes）
    // 可以获取非空闲不阻塞的lanes
    const nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
    // 存在nonIdleUnblockedLanes
    if (nonIdleUnblockedLanes !== NoLanes) {
      // 从nonIdleUnblockedLanes获取到最高优先级的lanes
      nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes);
    } else {
      const nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes;
      if (nonIdlePingedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(nonIdlePingedLanes);
      }
    }
  } else {
    // The only remaining work is Idle.
    const unblockedLanes = pendingLanes & ~suspendedLanes;
    if (unblockedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(unblockedLanes);
    } else {
      if (pingedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(pingedLanes);
      }
    }
  }
  // 返回nextLanes
  return nextLanes;
}
```
`getNextLanes`这个方法简单来说就是从非空间的足够优先级的`lanes`中取到最高优先级的`lanes`。`if else`语句则是从高优先级向低优先级依次降级判断是否存在非空闲的`lanes`的过程。  

然后再从`nextLanes`中取出最高优先级的`lane`，作为`newCallbackPriority`与`existingCallbackPriority`进行比较，决定是否需要重新开启一个状态更新流程。 

## 总结
`React`新版批量更新是基于`lane`模型实现的。在调用`performConcurrentWorkOnRoot`方法之前会判断当前根节点正在执行的任务和新创建的任务两者的优先级是否一致。  

如果优先级**一致**的话，将中途退出函数，不会开启新的状态更新流程，即**批量更新**。
如果优先级**不一致**的话，则会打断正在执行的任务，重新开启新的状态更新流程，即**高优先的更新打断低优先级的更新**。
