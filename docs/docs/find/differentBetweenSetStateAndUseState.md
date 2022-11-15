## setState和useState的区别

在React开发中的主要使用的两种组件类型是`ClassComponent`和`FunctionComponent`。

`ClassCompoent`中通常使用`this.setState`方法触发状态更新，从而改变`this.state`中响应的值。

`FunctionComponent`中经常使用`useState hooks`提供的`dispatchAction`的重命名方法`setState`触发状态更新，改变对应的`state`值。  

虽然这两种使用的目的和结果都是一样，触发状态更新和改变`state`，但是具体实现还是有比较大的区别。  

那么这次主要也是为了清楚的了解两个方法之前到底有哪些区别。

## this.setState

`this.setState`这个方法是被定义在`Component`这个函数原型上的。  

如代码所示：
```js
Component.prototype.setState = function(partialState, callback) {
  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
```
在代码中可以看到，`setState`方法调用的是`updater`对象上的`enqueueSetState`方法。那么这个`updater`又是在哪里定义的呢？  

如代码所示：
```js
const classComponentUpdater = {
  isMounted,
  enqueueSetState(inst, payload, callback) {
      // ...
  },
  enqueueReplaceState(inst, payload, callback) {
      // ...
  },
};

function adoptClassInstance(workInProgress: Fiber, instance: any): void {
  instance.updater = classComponentUpdater;
  // 将fiber节点与实例通过stateNode属性连接
  workInProgress.stateNode = instance;
  // The instance needs access to the fiber so that it can schedule updates
  setInstance(instance, workInProgress);
}
```
`enqueueSetState`方法定义在了一个变量`classComponentUpdater`上，并且通过`adoptClassInstance`方法赋值给组件的`updater`属性。  

而`adoptClassInstance`这个函数会在`constructClassInstance`调用。`constructClassInstance`方法会在`beginWork`中通过`updateClassComponent`执行，这个方法主要的工作是执行`ClassComponent`的`contructor`方法初始化`props、context、ref`等属性，当然也包括`updater`。  

如代码所示：
```js
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  // some code...

  switch (workInProgress.tag) {
     case ClassComponent: {
      const Component = workInProgress.type;
      const unresolvedProps = workInProgress.pendingProps;
      const resolvedProps =
        workInProgress.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      // 执行类组件的渲染，即执行它的render方法
      return updateClassComponent(
        current,
        workInProgress,
        Component,
        resolvedProps,
        renderLanes,
      );
    }
  }
  // some code...
}

function updateClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
) {
  const instance = workInProgress.stateNode;
  let shouldUpdate;
  if (instance === null) {
    // 执行classComponent的构造函数
    constructClassInstance(workInProgress, Component, nextProps);
    // 主要执行相关的生命周期函数
    mountClassInstance(workInProgress, Component, nextProps, renderLanes);
    shouldUpdate = true;
  } 
  // some code...
}

function constructClassInstance(
  workInProgress: Fiber,
  ctor: any,
  props: any,
): any {
  // some code...
  // 执行ClassComponent获取实例
  let instance = new ctor(props, context);
  // 获取ClassComponent的state属性
  const state = (workInProgress.memoizedState =
    instance.state !== null && instance.state !== undefined
      ? instance.state
      : null);
  // 赋值updater
  adoptClassInstance(workInProgress, instance);

  // some code...
}
```
综上所示，我们知道了`enqueueSetState`方法是从何而来，并且`updater`是在什么时候被赋值的。  

那么通过`this.setState`要修改的`state`又是赋值的呢？在`ClassComponent`中调用`this.setState`意味着触发状态更新，然后会以更新的方式使`ClassComponent`产生变化。这个过程是在`beginWork`的`updateClassComponent`中调用`updateClassInstance`方法实现的。在`updateClassInstance`中调用的`processUpdateQueue`方法的主要工作是计算具有足够**优先级**的`Update`对象上的`payload`属性，然后将结果合并到`this.state`中。  

如代码所示：
```js
// 简化后的代码
function updateClassInstance(
  current: Fiber,
  workInProgress: Fiber,
  ctor: any,
  newProps: any,
  renderLanes: Lanes,
): boolean {
  // some code...

  // 获取到旧的state
  const oldState = workInProgress.memoizedState;
  // 获取到新的state
  let newState = (instance.state = oldState);
  // 通过update计算出新的state
  processUpdateQueue(workInProgress, newProps, instance, renderLanes);
  newState = workInProgress.memoizedState;

  // some code...
}

function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes,
): void {
    // some code...

    // 计算state的具体方法
    newState = getStateFromUpdate(
        workInProgress,
        queue,
        update,
        newState, 
        props,
        instance,
    );

    // some code...
}

function getStateFromUpdate<State>(
  workInProgress: Fiber,
  queue: UpdateQueue<State>,
  update: Update<State>,
  prevState: State,
  nextProps: any,
  instance: any,
): any {
  // 更新的类型
  switch (update.tag) {
    // 更新的state
    case UpdateState: {
      // payload就是作为第一个参数通过this，setState传入的对象或者函数
      const payload = update.payload;
      let partialState;
      if (typeof payload === 'function') {
        // 如果payload是一个函数，则调用这个函数的结果，作为计算出的state
        partialState = payload.call(instance, prevState, nextProps);
      } else {
        // payload不是一个函数，那么就是一个具体的值
        partialState = payload;
      }
      // 如果计算出的state是null或undefined，说明计算出的state是无效的
      if (partialState === null || partialState === undefined) {
        // 返回旧的state
        return prevState;
      }
      // 重点
      // 计算出的state是有效的，则将计算出的state合并到this.state对象中
      return Object.assign({}, prevState, partialState);
    }
  }

  // 没有命中switch的逻辑，则返回this.state
  return prevState;
}
```
这段代码的重点是在`getStateFromUpdate`方法中使用`Object.assign`将*新的state*与*旧的state*进行合并，所以`this.setState`的赋值方式是**合并**。

## useState

`useState hooks`暴露出来的`dispatchAction`方法就是重命名的`setState`，也是在`FunctionComponent`中主要使用的更新`state`的方法，那么`setState`又是以什么方式赋值的呢？  
可以在`useState hooks`的实现中一探究竟。  

如代码所示：
```js
// 简化后的代码
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();

  queue.lastRenderedReducer = reducer;

  // some code...
  if (baseQueue !== null) {
    // 计算updateQueue上保存的update
    // 取到第一个update
    const first = baseQueue.next;
    // 取到当前基础的state
    let newState = current.baseState;

    let newBaseState = null;
    let update = first;
    do {
        // some code...

        // 计算update
        if (update.eagerReducer === reducer) {
          // 如果这个更新是迫切的，并且前后reduer相等，则使用提前计算的state
          newState = ((update.eagerState: any): S);
        } else {
          // 取到action
          const action = update.action;
          // reducer方法主要用来判断action是否是一个函数，然后再计算新的state
          // 其实就一行代码 typeof action ==== 'function' ? action(newState) : action;
          // 计算并返回新的state
          newState = reducer(newState, action);
        }
        // 取到下一个update
        update = update.next;
    } while (update !== null && update !== first);
    // 如果当前的baseQueue没有剩余的update，说明存在的update都计算完了
    if (newBaseQueueLast === null) {
      // newState作为本次更新最终的结果
      newBaseState = newState;
    } else {
      // 说明还存在没有被计算的update，那么继续计算
      newBaseQueueLast.next = (newBaseQueueFirst: any);
    }
    // 返回新的state
    hook.memoizedState = newState;
    // 保存变量
    queue.lastRenderedState = newState;
  }
  const dispatch: Dispatch<A> = (queue.dispatch: any);
  // 返回
  return [hook.memoizedState, dispatch];
}
```
这段代码主要做的工作是计算通过`setState`作为参数传入的值，其中最重要的一行`hook.memoizedState = newState`，这行代码就是将计算出的*新的state*保存在当前`hook`的`memoizedState`属性上，并最终返回。所以`setState`的赋值方式就是**重新赋值**，直接**替换**掉原先的值。

## useState的优化手段

`useState`的触发状态更新的方法`dispatchAction`具有一种优化手段。  

如代码所示：
```js
function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(fiber);

  const update: Update<S, A> = {
    lane,
    action,
    eagerReducer: null,
    eagerState: null,
    next: (null: any),
  };

  const alternate = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
    // order code...
  } else {
    // workInProgress Fiber节点和workInProgress.alternate Fiber节点都不存在更新
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // 获取到上一次更新时的reducer，通常是basicStateReducer
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        try {
          // 取到上一次更新时的state
          const currentState: S = (queue.lastRenderedState: any);
          // 通常计算state的工作是在updateReducer内进行的
          // 但是由于workInProgress Fiber节点和workInProgress.alternate Fiber节点都不存在更新
          // 所以会提前计算出新的state，方便进行优化
          const eagerState = lastRenderedReducer(currentState, action);
          // 并赋值eagerReducer和eagerState
          update.eagerReducer = lastRenderedReducer;
          update.eagerState = eagerState;
          // 如果计算出的state和上一次更新的state值一样
          // is是Object,is的polyfill实现
          if (is(eagerState, currentState)) {
            // 直接退出函数，这样就不会开启一次调度更新，因为新旧state的值一样，所以就不需要对组件进行更新，达到了性能优化的目的
            return;
          }
        } catch (error) {
          // ...
        } 
        }
      }
    }
    // 如果没有命中上面的优化逻辑，则开启调度更新
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
}
``` 
`useState`的性能优化手段是在执行`dispatchAction`方法时，特定情况下会通过`is(eagerState, currentState)`比较*新旧state*的值是否相等。如果*新旧state*相等的话，会提前退出函数，不会开启调度更新。从而避免不必要的更新，达到性能优化的目的。  

这个特定的情况是：当前组件**不存在更新**时，触发的**首次状态更新**是可以立即计算出**最新状态**的，然后与**当前状态**比较。如果两者的值一致，是不需要重新渲染组件的，也就不用调度更新。

## 总结

综上所述，虽然`this.setState`和`useState`都是作为`ClassComponent`和`FunctionComponent`各自触发状态更新的方法，作用都是一样的。但是，在实现的过程中还是却有比较大的区别。  

`this.setState`的赋值方式是将*新的state*与*旧的state*进行**合并**。  

而`useState`是用**重新赋值**的方式把*新state*替换掉*旧state*。  

并且`useState`本身还具有一种优化手段，首次触发的**状态更新**对应的*新state*与*旧state*值一致的话，不会调度更新。从而**避免不必要的更新**，达到性能优化的目的。