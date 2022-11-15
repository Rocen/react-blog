## 状态更新

*状态更新*通常是指状态的变化，例如当使用了`this.setState`或`useState`等方法，最后导致`state`的改变。这一过程被称为*状态更新*。  

我们知道状态更新流程开始后首先会创建`Update`对象。这个`Update`对象就是记录该次状态更新的数据结构。

## Update

### Update的分类
我们先来了解`Update`的结构。  

首先，将可以触发状态更新的方法所隶属的组件分类：
+ ReactDOM.render -- HostRoot
+ this.setState -- ClassComponent
+ this.foreceUpdate -- ClassComponent
+ useState -- FunctionComponent
+ useReducer -- FunctionComponent

可以看到，一共有三种组件：`HostRoot`、`ClassComponent`、`FunctionComponent`，可以触发状态更新。  

由于不同类型的组件工作的方式不同，所以存在两种不同结构的`Update`。其中`ClassComponent`和`HostRoot`共用一套`Update`结构，`FunctionComponent`单独使用一种`Update`结构。  

虽然，存在两种结构的`Update`，但是它们的工作机制与工作流程大致是相同的。本节先介绍前一种`Update`，`FunctionComponent`对应的`Update`在[这篇](../hooks/useStateAnduseReducer.md#调用阶段)介绍。

### Update的结构
`ClassComponent`和`HostRoot`共用同一种`Update`结构。
```js
const update: Update<*> = {
  eventTime, // 任务时间,通过performance.now()获取的毫秒数,但在未来会重构掉
  lane, // 优先级,意味着存在多个Update时，高优先级的Update会先被计算
  suspenseConfig, // Suspense相关，暂不关注
  tag: UpdateState, // 更新的类型，包括UpdateState | ReplaceState | ForceUpdate | CaptureUpdate
  payload: null, // 更新挂载的数据。不同类型组件挂载的数据不同。
                 // 对于ClassComponent，payload为this.setState的第一个传参。对于HostRoot，payload为ReactDOM.render的第一个传参。
  callback: null, // 更新的回调函数
                  // 对于ClassComponent，payload为this.setState的第二个传参。对于HostRoot，payload为ReactDOM.render的第三个传参。
  next: null, // 指向它的下一个Update，与其他Update连接形成链表
};
```
### Update与Fiber的联系
我们知道`Fiber`节点会组成`Fiber`树，而`Fiber`节点上的多个`Update`会组成链表，并被包含在`fiber.updateQueue`中。

需要说明的是，每次调用触发状态更新的方法时，都会创建一个`Update`。所以当在组件中多次使用了触发状态更新的方法，当然会创建多个`Update`。
```js
onClick() {
  this.setState({
    a: 1
  })

  this.setState({
    b: 2
  })
}
```
当在一个`ClassComponent`中触发`onClick`方法，在改方法内部调用了两次`this.setState`方法，这就会在这个组件对应的`Fiber`中创建两个`Update`对象，并连接成*单向环状链表*。  
因为从双缓存我们知道，`React`中最多同时存在两颗`Fiber`树：
+ 显示在当前页面中的`current Fiber`树
+ 在内存中正在构建的`workInProgress Fibe`树  

所以，在一个工作阶段中最多同时存在两个`updateQueue`：
+ `current Fiber`节点保存的`updateQueue`，即`current updateQueue`
+ `workInProgress Fiber`节点保存的`updateQueue`，即`workInProgress updateQueue`

在`commit`阶段完成页面渲染后，`workInProgress Fiber`树会替换`current Fiber`树，而`workInProgress Fiber`树中的`Fiber`节点的`updateQueue`就会变成`current updateQueue`。  

### updateQueue
`ClassComponent`和`HostRoot`使用的`UpateQueue`结构如下：
```js
const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
    effects: null,
  };
```
字段说明：
+ `baseState`：本次更新前该`Fiber`节点的`state`，`Update`会基于该`state`计算更新后的`state`
+ `firstBaseUpdate`与`lastBaseUpdate`：本次更新前该`Fiber`节点已保存的`Update`。以链表形式存在，链表头是`firstBaseUpdate`，链表尾是`lastBaseUpdate`。之所以在更新产生前该`Fiber`节点内就存在`Update`，是由于某些*优先级较低*的`Update`在上次`render`阶段由`Update`计算`state`时被跳过了
+ `shared.pending`：触发更新时，产生的`Update`会保存在`shared.pending`中形成*单向环状链表*。当计算`Update`时，这个环状链表会被剪开并连接在`lastBaseUpdate`后面
+ `effects`：数组，用来保存`update.callback !== null`的`Update`

## 优先级

通常，状态更新时由用户交互产生的，用户心里对交互顺序有个预期。`React`根据*人机交互研究的结果*中用户对交互的预期顺序为交互产生的状态更新赋予不同的*优先级*。  
具体如下：
+ 生命周期方法：同步执行
+ 受控的用户输入：如在输入框中输入文字，同步执行
+ 交互事件：如动画，高优先级执行
+ 其他：如请求数据，低优先及执行

优先级最终会反映到`update.lane`变量上，所以我们只需要根据这个变量就可以区分优先级。  

而优先级则决定了`update`执行的顺序。当存在多`个update`时，优先级越高的`update`就会优先执行，而优先级较低的`update`就会稍后执行。  

在创建`update`的方法`createUpdate`中会调用`requestUpdateLane`方法，这个方法的是作用决定即将创建的`update`的优先级。  

具体看下lane的定义：
```js
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
export const InputContinuousLane: Lanes = /*            */ 0b0000000000000000000000000000100;
export const DefaultLane: Lanes = /*                    */ 0b0000000000000000000000000010000;
```
由32位二进制位组成，`lane`的值越小对应的优先级越高，相反，`lane`的值越大对应的优先级越低。所以可以看到`SyncLane`的值最小，也就表示它的优先级最高。  

设置`lane`优先级的具体方法：
```js
function requestUpdateLane(fiber: Fiber): Lane {
  // order code...

  // 通过getCurrentUpdatePriority方法会获取当前触发状态更新的所在事件对应的lane优先级
  // 因为通过事件系统在调用合成事件对应注册的回调函数时，会设置该合成事件对应的lane优先级
  // 例如 此时通过click事件触发了一次状态更新，那么在收集事件监听器时会设置对应的合成事件触发事件dispatchDiscreteEvent
  // 之后在执行监听器队列时，就会执行这个dispatchDiscreteEvent方法
  // 在dispatchDiscreteEvent方法内部就会设置全局变量currentUpdatePriority，来记录当前正在执行的事件对应的lane优先级
  // 而getCurrentUpdatePriority返回的就是变量currentUpdatePriority的值
  // 所以，click事件触发的状态更新，获取的currentUpdatePriority值是DiscreteEventPriority，对应的lane优先级是SyncLane
  // 注：在react事件系统中，合成事件对应的事件优先级是预设好的，可以通过搜索getEventPriority函数查看
  const updateLane: Lane = (getCurrentUpdatePriority(): any);
  // 如果这次状态更新时通过合成事件触发的，因为合成事件一定存在对应的事件优先级及lane优先级，所以获取到的updateLane是不为NoLane的
  // NoLane的值是0
  if (updateLane !== NoLane) {
    // 最终返回合成事件对应的lane优先级
    return updateLane;
  }
  
  // 如果updateLane为NoLane，即值为0
  // 说明此次触发状态更新的方法不属于合成事件
  // 例如：setTimeout(() => setNum(1), 1000)
  // 通过setTimeout设置一个回调函数，在回调函数中触发状态更新，这个回调函数并不属于合成事件，所以currentUpdatePriority就是默认值NoLane，即0
  // 所以当通过getCurrentEventPriority方法获取这个回调函数的事件类型是undefined的，就会被赋值DefaultEventPriority，即DefaultLane
  const eventLane: Lane = (getCurrentEventPriority(): any);
  return eventLane;
}
```
从这段代码可以看到，在不同方法中触发的状态更新，通过`requestUpdateLane`方法获取`lane`的值是不相同的，所以也就决定了即将创建的`update`的优先级。

## 插入Update

`updateQueue`相关的代码逻辑都涉及到大量的链表操作。所以，通过具体的例子详细看下在源码中是如何操作`Update`的。
假设有一个`fiber`在`commit`阶段完成了渲染。该`fiber`上有两个由于优先级较低，所以在上次`render`阶段被跳过而没有处理的`Update`。他们会成为下次更新的`baseUpdate`。
我们称其为*u1*和*u2*，其中`u1.next === u2`。
```js
fiber.updateQueue.firstBaseUpdate === u1;
fiber.updateQueue.lastBaseUpdate === u2;
u1.next === u2;
```
如果用`-->`表示链表的指向：
```js
fiber.updateQueue.baseUpdate: u1 --> u2;
```
当我们在这个`fiber`上又触发两次状态更新，所以先后产生了两个新的`Update`，我们称为*u3*和*u4*。  
每个`Update`都会通过`enqueueUpdate`方法插入到`updateQueue`队列上。
当插入*u3*后：
```js
fiber.updateQueue.shared.pending === u3;
u3.next === u3;
```
如果当只存在一个新产生的`update`时，这个`update`会与自己形成一条*单项环状链表*。
```js
fiber.updateQueue.shared.pending: u3 
                                 ◥  \
                                / __ \
```
接着插入*u4*后：
```js
fiber.updateQueue.shared.pending === u4;
u4.next === u3;
u3.next === u4;
```
环状链表的最后一项要指向第一项，以此来形成环。
```js
fiber.updateQueue.shared.pending: u4 --> u3
                                   ▲     |
                                   └  ┘
```
`shared.pending`会保证始终指向最后一个插入的`update`。
更新调度完成之后会进入`render`阶段。
此时`shared.pending`的环会被剪开并连接在`updateQueue.lastBaseUpdate`后面：
```js
fiber.updateQueue.baseUpdate: u1 -> u2 -> u3 -> u4
```
接下来遍历`updateQueue.baseQueue`链表，以`fiber.updateQueue.baseState`为初始的`state`，然后以此与遍历到的每个`Update`计算并产生新的`state`。
在遍历时如果有优先级较低的`Update`会被**跳过**。  

当遍历完成后获取的`state`，就是该`Fiber`节点在本次更新的`state`，被称为`memoizedState`。  

`state`的变化在`render`阶段产生与上次更新不同的`JSX`对象，通过`diff算法`会产生`effectTag`，表示该`Fiber`节点需要进行更新，最终通过`commit`阶段渲染到页面上。  

在`layout`阶段之后，完成`current`指针的切换，`workInProgress Fiber`树就会变为`current Fiber`树，整个更新流程结束。

## 计算Update

如果在一个组件中存在两种触发状态更新的方式，一个状态更新负责修改主题的颜色，一个状态更新负责修改输入框的内容。其中修改主体颜色更新先触发，随后又触发了一个修改输入框内容的更新。我们将修改颜色的`Update`称为*u1*，修改输入框的`Update`称为*u2*。
其中*u1*先触发，就会先进入`render`阶段，但本身类似于定时器触发的更新，所以优先级比较低。此时：
```js
updateQueue = {
    baseState: {
        darkTheme: true,
        text: 'a'
    },
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
        pending: u1
    },
    effects: null
}
```
在*u1*完成`render`阶段前用户通过键盘输入了字母*b*，所以就产生了*u2*。因为这种操作属于受控的用户输入，所以优先级较高，于是*u2*会中断*u1*进行的`render`阶段。此时：
```js
updateQueue = {
    baseState: {
        darkTheme: true,
        text: 'a'
    },
    fristBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
        pending: u2 -> u1
    },
    effects: null
}
```
接下来将进入计算`update`的流程，首先会将`shared.pending`上的环状链表会被**剪开**并连接到`baseUpdate`上。此时：
```js
updateQueue = {
    baseState: {
        darkTheme: true,
        text: 'a'
    },
    fristBaseUpdate: u1,
    lastBaseUpdate: u2,
    shared: {
        pending: null
    },
    effects: null
}
```
随后会进入到从`baseUpdate`开始遍历计算`update`，当遍历到*u1*时，由于其优先级不足，所以会被跳过，转而遍历*u2*。  

但由于`update`之间可能有**依赖关系**，所以被跳过的`update`及其之后**所有**的`update`都会成为下次更新的`baseUpdate`（即u1 -- u2）。  

当u2完成`render - commit`阶段，此时：
```js
updateQueue = {
    baseState: {
        darkTheme: true,
        text: 'ab'
    },
    fristBaseUpdate: u1,
    lastBaseUpdate: u2,
    shared: {
        pending: null
    },
    effects: null
}
```
在`commit`阶段的末尾会再调度一次更新，在该次更新中会基于`baseState`中`firstBaseUpdate`保存的*u1开*启一次新的`render`阶段。
在经过两次计算`update`之后的结果如下：
```js
updateQueue = {
    baseState: {
        darkTheme: false,
        text: 'ab'
    },
    fristBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
        pending: null
    },
    effects: null
}
```
## 状态更新相关源码

以上是通过具体的例子演示创建`update`和计算`update`的过程，那么接下来从源码的角度看代码是如何操作`update`的。  

首先，会通过`createUpdate`方法创建`update`对象。
```js
function createUpdate(eventTime: number, lane: Lane): Update<*> {
  const update: Update<*> = {
    eventTime,
    lane,

    tag: UpdateState,
    payload: null,
    callback: null,

    next: null,
  };
  return update;
}
```
然后通过`enqueueUpdate`方法，将创建的`update`插入到`updateQueue`中。
```js
function enqueueUpdate<State>(
  fiber: Fiber,
  update: Update<State>,
  lane: Lane,
) {
  // 取到updateQueue队列
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    // 当该Fiber被卸载时，会提前退出函数.
    return;
  }
  // 取到sharedQueue
  const sharedQueue: SharedQueue<State> = (updateQueue: any).shared;

  if (isInterleavedUpdate(fiber, lane)) {
    // order code...
  } else {
    // 取到pending
    const pending = sharedQueue.pending;
    // 当pending为null时，说明当前update是该Fiber节点上的第一个update
    if (pending === null) {
      // 所以它需要与自己连接形成环状链表，即next指针指向自己
      update.next = update;
    } else {
      // 当存在多个update时，该update是最后一个update，所以需要连接在当前链表的末尾
      // shared.pending始终指向该链表最后一个update，那么shared.pending.next就是指向该链表第一个update
      // 因为当前这个update即将成为该链表的最后一个update，所以它的指针需要指向该链表的第一个update
      update.next = pending.next;
      // 当插入一个updat时，就需要将它连接到最后一个update后面，即pending.next = update。让这个update称为该链表最后一个update
      pending.next = update;
    }
    // shared.pending始终指向该链表最后一个update，也就是当前的update
    sharedQueue.pending = update;
  }
}
```
`enqueueUpdate`主要是负责执行`update`的插入操作，其中就涉及到了链表的操作，单凭文字可能比较难理解，结合一个具体的例子再加深下理解。
```
// 当前updateQueue上存在4个update，模拟环状链表的结构
sharedQueue: 4 -> 1 -> 2 -> 3 -> 4

// 此时新创建了一个update 5，就需要将这个update插入到这个环状链表里面

// 首先需要将5的next指针指向第一个update
5.next = 1; // 5 -> 1
// 再将该环状链表的最后一个update的next指针指向这个新的update
4.next = 5; // 4 -> 5
// 这样就完成了update的插入操作
sharedQueue: 1 -> 2 -> 3 -> 4 -> 5 -> 1
// 最后再将share.pending赋值为该链表的最后一个update
shared.pending: 5 -> 1 -> 2 -> 3 -> 4 -> 5
```
我们再看一下this.setState这个方法具体这个哪些工作。
```js
// 我们通常使用的this.setState
Component.prototype.setState = function(partialState, callback) {
  invariant(
    typeof partialState === 'object' ||
      typeof partialState === 'function' ||
      partialState == null,
    'setState(...): takes an object of state variables to update or a ' +
      'function which returns an object of state variables.',
  );
  // 实际调用的方法
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

// 实际进行工作的方法
enqueueSetState(inst, payload, callback) {
    // 获取fiber节点
    const fiber = getInstance(inst);
    // 获取过期时间
    const eventTime = requestEventTime();
    // 获取优先级
    const lane = requestUpdateLane(fiber);
    // 创建upadte
    const update = createUpdate(eventTime, lane);
    // 赋值payload属性，即this.setState的第一个参数
    update.payload = payload;
    // 当我们通过this.setState传递第二个参数时，会被赋值为callback属性
    if (callback !== undefined && callback !== null) {
      // 赋值callback
      update.callback = callback;
    }
    // 将update插入到updateQueue中
    enqueueUpdate(fiber, update, lane);
    // 开启状态更新，即React完整的工作流程
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);
  },
```
从这段代码可以看出，`this.setState`是一个作为顶层`API`暴露给开发者使用的，而在源码内部其实使用的是`enqueueSetState`方法。  

这个`enqueueSetState`方法主要做了三件事：
1. 创建`update`
2. 将`update`插入到`updateQueue`中
3. 开启一次状态更新流程

对于产生的`update，react`是如何进行计算的？  

计算`update`的工作是在`beginWork`方法中进行的，通过入口函数`updateClassComponent`间接调用`processCommitUpdate`完成`update`的计算工作。
```js
function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes,
): void {
  // 获取当前Fiber节点上的updateQueue
  const queue: UpdateQueue<State> = (workInProgress.updateQueue: any);

  hasForceUpdate = false;

  // 取到第一个baseUpdate
  let firstBaseUpdate = queue.firstBaseUpdate;
  // 取到最后一个baseUpdate
  let lastBaseUpdate = queue.lastBaseUpdate;

  // 获取shared.pending
  let pendingQueue = queue.shared.pending;
  // 存在需要计算的update
  if (pendingQueue !== null) {
    // 先重置shared.pending
    queue.shared.pending = null;

    // 剪开shared.pending上的环状链表
    // 取到shared.pending上最后一个update
    const lastPendingUpdate = pendingQueue;
     // 取到shared.pending上第一个update
    const firstPendingUpdate = lastPendingUpdate.next;
    // 剪开环，即将lastPendingUpdate.next置null，这样最后一个update就不再指向第一个update了，由此变成了一条单项链表
    lastPendingUpdate.next = null;
    // 将等待计算的update连接到baseQueue上
    // 如果最后一个基础update为null，说明当前还没有baseUpdate
    if (lastBaseUpdate === null) {
      // 则将第一个等待计算的update作为第一个baseUpdate
      firstBaseUpdate = firstPendingUpdate;
    } else {
      // 否则，说明当前存在基础update，需要将等待计算的update链表连接到最后一个基础update后面
      lastBaseUpdate.next = firstPendingUpdate;
    }
    // 将最后一个等待计算的update作为最后一个基础update
    lastBaseUpdate = lastPendingUpdate;

    // 获取到workInProgress Fiber节点通过alternate连接的current Fiber节点
    const current = workInProgress.alternate;
    // current不为null
    if (current !== null) {
      // /*保证Update不丢失*/
      // 再获取到current上的updateQueue
      const currentQueue: UpdateQueue<State> = (current.updateQueue: any);
      // 获取到current上的最后一个baseUpdate
      const currentLastBaseUpdate = currentQueue.lastBaseUpdate;
      // 当current上最后一个baseUpdate不等于workInProgress上最后一个基础update，说明存在更新
      if (currentLastBaseUpdate !== lastBaseUpdate) {
        // 将shared.pending这条等待计算的链表同时连接到current的baseUpdate上，目的是保存这条链表
        if (currentLastBaseUpdate === null) {
          currentQueue.firstBaseUpdate = firstPendingUpdate;
        } else {
          currentLastBaseUpdate.next = firstPendingUpdate;
        }
        currentQueue.lastBaseUpdate = lastPendingUpdate;
      }
    }
  }

  // 开始计算update
  if (firstBaseUpdate !== null) {
    // 获取当前baseState
    let newState = queue.baseState;
    // 优先级相关
    let newLanes = NoLanes;
    // 即将计算的baseState的值
    let newBaseState = null;
    // 被跳过的update会通过newFirstBaseUpdate和newLastBaseUpdate变量保存
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate = null;
    // 获取第一个baseUpdate
    let update = firstBaseUpdate;
    do {
      const updateLane = update.lane;
      const updateEventTime = update.eventTime;
      //  当前这个update，因为优先级不足，而需要被跳过，则将这个update复制一份，并保存到baseUpdate上，作为下次计算update时的baseUpdate
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // 复制这个update
        const clone: Update<State> = {
          eventTime: updateEventTime,
          lane: updateLane,
          tag: update.tag,
          payload: update.payload,
          callback: update.callback,

          next: null,
        };
        // 将复制的update连接到newBaseUpdate上
        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          // 当下次计算这个被跳过的update时，它的baseState是基于被跳过的update对应的当前的newState计算的
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        // 合并优先级
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        // 当update存在足够的优先级，计算它

        // **保证状态依赖的连续性**
        // 当newLastBaseUpdate不为空，说明存在被跳过的update，那么当下次计算这个被跳过的update时需要将这个update之后的所有update都进行计算
        // 所以此时会收集被跳过update之后连续的所有update
        if (newLastBaseUpdate !== null) {
          const clone: Update<State> = {
            eventTime: updateEventTime,
            lane: NoLane,
            tag: update.tag,
            payload: update.payload,
            callback: update.callback,

            next: null,
          };
          // 将该update的clone项连接到baseUpdate上
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }

        // 计算这个update
        // 大致的流程：update.payload如果是函数，则执行它，将它的结果作为partialState
        // update.payload不是函数，则它作为partialState
        // 最后this.state和partialState使用Object.assign浅合并的结果作为函数的返回值
        newState = getStateFromUpdate(
          workInProgress,
          queue,
          update,
          newState,
          props,
          instance,
        );
        // 获取update中callback
        const callback = update.callback;
        // 当存在这个callback属性，说明存在自定义的回调函数
        if (
          callback !== null &&
          update.lane !== NoLane
        ) {
          workInProgress.flags |= Callback;
          const effects = queue.effects;
          // 将这个回调函数保存到updateQueue.effects数组中
          if (effects === null) {
            queue.effects = [update];
          } else {
            effects.push(update);
          }
        }
      }
      // 移动next指针指向下一个update
      update = update.next;
      // 如果update为null，说明shared.pending上保存的update都已经遍历完了
      if (update === null) {
        // 再判断shared.pending是否为null
        pendingQueue = queue.shared.pending;
        if (pendingQueue === null) {
          // 为null，说明不存在需要计算的update，表示update都被计算完了
          // 跳出循环
          break;
        } else {
          // pendingQueue不为null，说明在计算update时又触发了新的状态更新
          // 例如: this.setState(() => {
          //    this.setState({num: 2});
          //    return ({num: 1})
          // })
          // 外层的this.setState触发了一次状态更新，创建了一个update
          // 当在计算这update时，内部又触发一次状态更新，所以又会创建一个update
          // 而这个update就会被插入到pendingQueue中，仍然需要计算

          // 执行的操作依然是把pendingQueue上保存的环状链表剪开，并连接到baseUpdate上
          const lastPendingUpdate = pendingQueue;
          const firstPendingUpdate = ((lastPendingUpdate.next: any): Update<State>);
          // 剪开环
          lastPendingUpdate.next = null;
          // 从第一个update开始计算
          update = firstPendingUpdate;
          queue.lastBaseUpdate = lastPendingUpdate;
          queue.shared.pending = null;
        }
      }
    } while (true);
    // 如果newLastBaseUpdate为null，表示不存在被跳过的update
    if (newLastBaseUpdate === null) {
      // 则新的baseState的值就是最终计算得出的state的值
      newBaseState = newState;
    }
    // 更新baseState
    queue.baseState = ((newBaseState: any): State);
    // 最终被跳过的update会再次赋值给baseUpdate，等到下次计算这些update
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;

    workInProgress.lanes = newLanes;
    // 所以，最后计算出的新的state，会保存在fiber.memoizedState属性上
    workInProgress.memoizedState = newState;
  }
}
```
从这段代码可以看到，通过`baseState`和`pendingQueue`上保存的等待计算的`update`，最终计算出来的结果`newState`会被赋值给`fiber.memoizedState`。  

那么`fiber.memoizedState`又会被如何使用呢？`processUpdateQueue`的上层函数`updateClassInstance`中：
```js
function updateClassInstance(
  current: Fiber,
  workInProgress: Fiber,
  ctor: any,
  newProps: any,
  renderLanes: Lanes,
): boolean {
  // order code...

  const oldState = workInProgress.memoizedState;
  let newState = (instance.state = oldState);
  // 计算update
  processUpdateQueue(workInProgress, newProps, instance, renderLanes);
  // fiber.memoizedState是计算出的最终的state
  newState = workInProgress.memoizedState;

  // order code...
  
  // 将newProps赋值给实例的props
  instance.props = newProps;
  // 将newState赋值给实例的state
  instance.state = newState;
  
  return ...
}
```
从这段代码可以看到，通过计算`update`得出的`newState`最终会被赋值给实例的`state`，这样当我们在`ClassComponent`当中使用`this.state`就可以得到新的`state`了。

## 保证Update不丢失

从`updateQueue`的工作流程中可以看到，`render`阶段可能被终端，那是如何保证`updateQueue`中保存的`update`不丢失的呢？  

在`render`阶段，`shared.pending`的环会被剪开并连接在`updateQueue.lastBaseUpdate`后面。同时，也会通过`workInProgress.alternate`取到`current`，再连接到`current updateQueue.lastBaseUpdate`后面。  
当`render`阶段被中断后重新开始时，会基于`current updateQueue`克隆出`workInProgress updateQueue`。由于`current updateQueue.lastBaseUpdate`已经保存了上一次的`update`，所以不会丢失。  

当`commit`阶段完成渲染，由于`workInProgress updateQueue.lastBaseUpdate`中保存了上一次的`update`，所以`workInProgress Fiber`树变成`current Fiber`树后也不会造成`Update`的丢失。  

对应的的代码部分可以查看上面代码中*保证Update不丢失*的部分。

## 保证状态依赖的连续性

当某个`update`由于优先级较低而被跳过时，保存在`baseUpdate`中的不仅是该`update`，还包括链表中该`update`之后所有的`update`。  
所谓**状态依赖**是指当前触发的状态更新需要依靠前一个触发的状态更新的结果。比如：
```js
// 先触发了优先级较低的u1
this.setState({num: 10})

// 后触发了优先级较高的u2
this.setState((prevState) => ({
    ...prevState,
    double: prevState.num * 2
}))
```
在这个例子中，存在两次状态更新，*u2*需要获取*u1*的`state.num`值来计算此次修改的`double`的值。每当通过`this.setState`第一个参数使用函数的形式时传递`state`参数，通常属于`状态依赖`。这种情况中前一个状态更新结果的正确与否就决定下一个状态更新的结果是否是正确的。  

当第一次计算`update`时，*u1*由于优先级不足被跳过了，而计算了第二个优先级较高的*u2*。虽然直接计算*u2*得出的结果肯定不是正确的，但是也只会作为中间状态存在。  

等到第二次计算`update`时，就会计算被跳过的*u1*和它之后的**所有**`update`（也就是`u1 -- u2`的顺序），而得出具有正确状态依赖关系的的`state`值作为最终的计算结果。

对应的的代码部分可以查看上面代码中*保证状态依赖的连续性*的部分。  

## 总结

状态更新的整个工作流程主要分为两部分：
1. 通过`this.setState`触发**状态更新**（包括创建`Update`，插入`Update`和开启调度更新）
2. 在`beginWork`方法中间接调用`processCommitUpdate`计算产生的`update`˜

虽然看起来可能状态更新的工作流程比较简短，但是涉及到的内容非常多，而且计算的过程也比较复杂（包括链表的操作和优先级相关），所以如果想要彻底弄懂这部分内容还是需要重复学习和理解的。


