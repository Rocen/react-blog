## 生命周期

React官网对于生命周期的定义是：
> 我们可以为 class 组件声明一些特殊的方法，当组件挂载或卸载时就会去执行这些方法。这些方法叫做“生命周期函数”

[这里](https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)可以查看完整的完整生命周期。

## 生命周期的执行过程

将组件分为挂载、更新和卸载三个阶段分别分析：

## 挂载阶段

### 执行constructor
在`mount`时，首先会执行`constructClassInstance`方法，用来实例化`ClassComponent`：
```js
function constructClassInstance(
  workInProgress: Fiber,
  ctor: any,
  props: any,
): any {
  let isLegacyContextConsumer = false;
  let unmaskedContext = emptyContextObject;
  let context = emptyContextObject;
  const contextType = ctor.contextType;
  // 获取执行上下文
  if (typeof contextType === 'object' && contextType !== null) {
    context = readContext((contextType: any));
  }
  // ctor就是类组件本身
  // 获取组件的实例
  let instance = new ctor(props, context);
  // 获取state
  const state = (workInProgress.memoizedState =
    instance.state !== null && instance.state !== undefined
      ? instance.state
      : null);
  // 绑定updater，绑定组件与实例的关系：workInProgress.stateNode = instance;
  adoptClassInstance(workInProgress, instance);
  // 返回实例
  return instance;
}

```
在组件实例化之后，会调用mountClassInstance进行组件初始化。
```js
function mountClassInstance(
  workInProgress: Fiber,
  ctor: any,
  newProps: any,
  renderLanes: Lanes,
): void {
  // 获取组件的实例
  const instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = emptyRefsObject;
  // 初始化updateQueue
  initializeUpdateQueue(workInProgress);

  const contextType = ctor.contextType;
  if (typeof contextType === 'object' && contextType !== null) {
    instance.context = readContext(contextType);
  } else if (disableLegacyContext) {
    instance.context = emptyContextObject;
  } else {
    const unmaskedContext = getUnmaskedContext(workInProgress, ctor, true);
    instance.context = getMaskedContext(workInProgress, unmaskedContext);
  }
  // 初始化state
  instance.state = workInProgress.memoizedState;
  // 获取getDerivedStateFromProps方法
  const getDerivedStateFromProps = ctor.getDerivedStateFromProps;
  if (typeof getDerivedStateFromProps === 'function') {
    // 如果存在getDerivedStateFromProps方法，则执行它
    applyDerivedStateFromProps(
      workInProgress,
      ctor,
      getDerivedStateFromProps,
      newProps,
    );
    // 重新赋值state，因为applyDerivedStateFromProps可能会修改state
    instance.state = workInProgress.memoizedState;
  }

  if (
    typeof ctor.getDerivedStateFromProps !== 'function' &&
    typeof instance.getSnapshotBeforeUpdate !== 'function' &&
    (typeof instance.UNSAFE_componentWillMount === 'function' ||
      typeof instance.componentWillMount === 'function')
  ) {
    // 如果不存在getDerivedStateFromProps和getSnapshotBeforeUpdate，并且存在componentWillMount生命周期函数
    // 调用componentWillMount
    callComponentWillMount(workInProgress, instance);
    // 计算updateQueue上保存的update
    processUpdateQueue(workInProgress, newProps, instance, renderLanes);
    // 重新赋值state
    instance.state = workInProgress.memoizedState;
  }

  if (typeof instance.componentDidMount === 'function') {
    // 如果存在componentDidMount生命周期函数
    let fiberFlags: Flags = Update;
    // 为当前Fiber节点标记Update effectTag，表示组件需要更新，在DOM节点挂载后会再调用componentDidMount方法
    workInProgress.flags |= fiberFlags;
  }
}
```
### 执行getDerivedStateFromProps 
在初始化阶段，`getDerivedStateFromProps`是第二个执行的生命周期函数。值得注意的是，它是从`ctor`类上直接绑定的静态方法，传入的`props`，`state`。返回值将和之前的`state`合并，作为新的`state`，传递给组件实例使用。  

### 执行componentWillMount
如果存在`getDerivedStateFromProps`和`getSnapshotBeforeUpdate`就不会执行生命周期`componentWillMount`。

### 执行render
在`finishClassComponent`方法中会执行`render`方法，即进行组件的渲染。
```js
function finishClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  shouldUpdate: boolean,
  hasContext: boolean,
  renderLanes: Lanes,
) {
  // 更新ref
  markRef(current, workInProgress);
  // 是否捕获到错误
  const didCaptureError = (workInProgress.flags & DidCapture) !== NoFlags;

  if (!shouldUpdate && !didCaptureError) {
    // shouldUpdate表示是否应该渲染组件
    // 不需要渲染组件，并且没有捕获到错误，则复用上一次更新时的Fiber节点
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  // 获取组件实例
  const instance = workInProgress.stateNode;

  // Rerender
  ReactCurrentOwner.current = workInProgress;
  let nextChildren;
  if (
    didCaptureError &&
    typeof Component.getDerivedStateFromError !== 'function'
  ) {
    // 如果捕获到错误了
    // 不渲染组件
    nextChildren = null;
  } else {
    // 否则，执行组件的render方法，进行组件渲染
    nextChildren = instance.render();
  }
  // 根据组件渲染的结果创建对应的Fiber节点
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  // 保存state
  workInProgress.memoizedState = instance.state;
  // 返回创建的Fiber节点
  return workInProgress.child;
}
```
### 执行componentDidMount
在`commot`阶段的`layout`阶段，会调用`commitLayoutEffectOnFiber`方法执行`componentDidMount`生命周期函数：
```js
function commitLayoutEffectOnFiber(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
    switch(finishedWork.tag) {
        case ClassComponent: {
            const instance = finishedWork.stateNode;
            if (finishedWork.flags & Update) {
                // 判断current fiber是否存在
                if (current === null) {
                    // current为null，说明是mount
                    // 执行componentDidMount生命周期函数
                    instance.componentDidMount();
                } else {
                     // current不为null，说明是update
                    const prevProps =
                        finishedWork.elementType === finishedWork.type
                        ? current.memoizedProps
                        : resolveDefaultProps(
                            finishedWork.type,
                            current.memoizedProps,
                            );
                    const prevState = current.memoizedState;
                    // 执行componentDidUpdate生命周期函数
                    instance.componentDidUpdate(
                        prevProps,
                        prevState,
                        instance.__reactInternalSnapshotBeforeUpdate,
                    );
                }
            }
        break;
      }
    }
}
```
挂载阶段生命周期的执行顺序：`constructor` -> `getDerivedStateFromProps` / `componentWillMount` -> `render` -> `componentDidMount`

## 更新阶段

在更新阶段会调用`updateClassInstance`方法：
```js
function updateClassInstance(
  current: Fiber,
  workInProgress: Fiber,
  ctor: any,
  newProps: any,
  renderLanes: Lanes,
): boolean {
  const instance = workInProgress.stateNode;
  // 从current fiber节点克隆updateQueue，然后赋值到workInProgress fiber
  cloneUpdateQueue(current, workInProgress);

  const unresolvedOldProps = workInProgress.memoizedProps;
  const oldProps =
    workInProgress.type === workInProgress.elementType
      ? unresolvedOldProps
      : resolveDefaultProps(workInProgress.type, unresolvedOldProps);
  instance.props = oldProps;
  const unresolvedNewProps = workInProgress.pendingProps;
  // 获取getDerivedStateFromProps方法
  const getDerivedStateFromProps = ctor.getDerivedStateFromProps;
  // 是否存在新生命周期函数
  const hasNewLifecycles =
    typeof getDerivedStateFromProps === 'function' ||
    typeof instance.getSnapshotBeforeUpdate === 'function';

  if (
    !hasNewLifecycles &&
    (typeof instance.UNSAFE_componentWillReceiveProps === 'function' ||
      typeof instance.componentWillReceiveProps === 'function')
  ) {
    // 不存在新生命周期函数，并且存在componentWillReceiveProps生命周期函数
    if (
      unresolvedOldProps !== unresolvedNewProps ||
      oldContext !== nextContext
    ) {
      // 新旧props不相等时，或者上下文不相等时
      // 调用componentWillReceiveProps生命周期函数
      callComponentWillReceiveProps(
        workInProgress,
        instance,
        newProps,
        nextContext,
      );
    }
  }
  // 获取旧新state
  const oldState = workInProgress.memoizedState;
  let newState = (instance.state = oldState);
  // 计算update
  processUpdateQueue(workInProgress, newProps, instance, renderLanes);
  // 获取新state
  newState = workInProgress.memoizedState;

  if (
    unresolvedOldProps === unresolvedNewProps &&
    oldState === newState
  ) {
    // 旧新pros和旧新state都相等，说明不需要执行组件的渲染
    if (typeof instance.componentDidUpdate === 'function') {
      //  存在componentDidUpdate生命周期函数
      if (
        unresolvedOldProps !== current.memoizedProps ||
        oldState !== current.memoizedState
      ) {
        // 旧props和旧state不相等
        // 为Fiber节点标记Update effectTag
        workInProgress.flags |= Update;
      }
    }
    if (typeof instance.getSnapshotBeforeUpdate === 'function') {
      // 存在getSnapshotBeforeUpdate生命周期函数
      if (
        unresolvedOldProps !== current.memoizedProps ||
        oldState !== current.memoizedState
      ) {
        // 旧props和旧state不相等
        // 为Fiber节点标记Snapshot effectTag
        workInProgress.flags |= Snapshot;
      }
    }
    // 返回false，表示不需要进行组件渲染
    return false;
  }

  if (typeof getDerivedStateFromProps === 'function') {
    // 存在getDerivedStateFromProps生命周期函数
    // 执行getDerivedStateFromProps生命周期函数
    applyDerivedStateFromProps(
      workInProgress,
      ctor,
      getDerivedStateFromProps,
      newProps,
    );
    // 重新赋值state
    newState = workInProgress.memoizedState;
  }
  // 获取shouldUpdate
  const shouldUpdate =
    // 是否调用forceUpdate方法
    checkHasForceUpdateAfterProcessing() ||
    // 调用shouldComponentUpdate生命周期函数并获取返回结果
    checkShouldComponentUpdate(
      workInProgress,
      ctor,
      oldProps,
      newProps,
      oldState,
      newState,
      nextContext,
    )

  if (shouldUpdate) {
    // 需要进行组件熏染
    if (
      !hasNewLifecycles &&
      (typeof instance.UNSAFE_componentWillUpdate === 'function' ||
        typeof instance.componentWillUpdate === 'function')
    ) {
      if (typeof instance.componentWillUpdate === 'function') {
        // 执行componentWillUpdate生命周期函数
        instance.componentWillUpdate(newProps, newState, nextContext);
      }
      if (typeof instance.UNSAFE_componentWillUpdate === 'function') {
        // 执行componentWillUpdate生命周期函数
        instance.UNSAFE_componentWillUpdate(newProps, newState, nextContext);
      }
    }
    if (typeof instance.componentDidUpdate === 'function') {
      // 为Fiber节点标记Update effectTag
      workInProgress.flags |= Update;
    }
    if (typeof instance.getSnapshotBeforeUpdate === 'function') {
      // 为Fiber节点标记Snapshot effectTag
      workInProgress.flags |= Snapshot;
    }
  } else {
    // 不需要进行组件渲染
    if (typeof instance.componentDidUpdate === 'function') {
      if (
        unresolvedOldProps !== current.memoizedProps ||
        oldState !== current.memoizedState
      ) {
        // 旧props和旧state不相等
        // 为Fiber节点标记Update effectTag
        workInProgress.flags |= Update;
      }
    }
    if (typeof instance.getSnapshotBeforeUpdate === 'function') {
      if (
        unresolvedOldProps !== current.memoizedProps ||
        oldState !== current.memoizedState
      ) {
        // 旧props和旧state不相等
        // 为Fiber节点标记Snapshot effectTag
        workInProgress.flags |= Snapshot;
      }
    }

    // 保存新props和新state
    workInProgress.memoizedProps = newProps;
    workInProgress.memoizedState = newState;
  }

  // 赋值新props和新state
  instance.props = newProps;
  instance.state = newState;
  instance.context = nextContext;
  // 返回shouldUpdate
  return shouldUpdate;
}
```
### 执行componentWillReceiveProps
首先判断`getDerivedStateFromProps`生命周期是否存在，如果不存在就执行`componentWillReceiveProps`生命周期。传入该生命周期的两个参数分别是`newProps`和`nextContext`。

### 执行getDerivedStateFromProps
然后执行生命周期`getDerivedStateFromProps`，返回的值用于合并`state`，生成新的`state`。

### 执行shouldComponentUpdate
接着执行生命周期`shouldComponentUpdate`，传入新的`props`、新的`state`和新的`context`。返回一个布尔值，决定是否渲染组件，即是否执行`render`函数。  
这里应该注意一个问题，`getDerivedStateFromProps`的返回值可以作为新的`state`，传递给`shouldComponentUpdate`。

### 执行componentWillUpdate
最后来执行生命周期`componentWillUpdate`。

### 执行render
与挂载阶段一样，都是通过`finishClassComponent`方法执行`render`方法。

### 执行getSnapshotBeforeUpdate
在`commit`阶段的`before mutation`阶段，调用`commitBeforeMutationEffectsOnFiber`方法执行`getSnapshotBeforeUpdate`，该生命周期的返回值将作为第三个参数`__reactInternalSnapshotBeforeUpdate`传递给`componentDidUpdate`：
```js
function commitBeforeMutationEffectsOnFiber(finishedWork: Fiber) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

    switch (finishedWork.tag) {
      case ClassComponent: {
        if (current !== null) {
          const prevProps = current.memoizedProps;
          const prevState = current.memoizedState;
          const instance = finishedWork.stateNode;
          // 执行getSnapshotBeforeUpdate生命周期函数
          const snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps),
            prevState,
          );
          // 赋值__reactInternalSnapshotBeforeUpdate
          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
        }
        break;
      }
  }
}
```

### 执行componentDidUpdate
在`commit`阶段的`layout`阶段，调用`commitLayoutEffectOnFiber`方法执行`componentDidUpdate`生命周期函数：
```js
function commitLayoutEffectOnFiber(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
    switch(finishedWork.tag) {
        case ClassComponent: {
            const instance = finishedWork.stateNode;
            if (finishedWork.flags & Update) {
                // 判断current fiber是否存在
                if (current === null) {
                    // current不存在，说明是mount
                    // 执行componentDidMount生命周期函数
                    instance.componentDidMount();
                } else {
                    // current存在，说明是update
                    const prevProps =
                        finishedWork.elementType === finishedWork.type
                        ? current.memoizedProps
                        : resolveDefaultProps(
                            finishedWork.type,
                            current.memoizedProps,
                            );
                    const prevState = current.memoizedState;
                    // 执行componentDidUpdate生命周期函数
                    instance.componentDidUpdate(
                        prevProps,
                        prevState,
                        instance.__reactInternalSnapshotBeforeUpdate,
                    );
                }
            }
        break;
      }
    }
}
```
更新阶段生命周期的执行顺序：`componentWillReceiveProps`(props改变) / `getDerivedStateFromProps` -> `shouldComponentUpdate` -> `componentWillUpdate` -> `render` -> `getSnapshotBeforeUpdate` -> `componentDidUpdate`

## 销毁阶段

### 执行componentWillUnmount
首先在`beginWork`中创建`Fiber`节点时会使用`reconcileChildren`方法对更新前后的`Fiber`节点进行`diff`比较，将需要删除的节点`push`到父级`Fiber`节点的`deletions`数组中，表示需要对这些`Fiber`节点执行删除操作。  
然后在`mutation`阶段会遍历`workInProgress Fiber`树，对于保存在`deletions`数组中`Fiber`节点会调用`commitDeletion`方法，在内部间接执行`commitUnmount`方法，最终执行实例的`componentWillUnmount`生命周期函数：
```js
function commitUnmount(
  finishedRoot: FiberRoot,
  current: Fiber,
  nearestMountedAncestor: Fiber,
): void {
  onCommitUnmount(current);

  switch (current.tag) {
    case ClassComponent: {
      // 解绑ref
      safelyDetachRef(current, nearestMountedAncestor);
      const instance = current.stateNode;
      if (typeof instance.componentWillUnmount === 'function') {
        // 该方法内部还会再调用callComponentWillUnmountWithTimer，再由这个方法执行instance.componentWillUnmount();
        safelyCallComponentWillUnmount(
          current,
          nearestMountedAncestor,
          instance,
        );
      }
      return;
    }
  }
}
```
## 不安全的生命周期

目前在`React`官网会特别提示有一些即将过时的生命周期：
+ UNSAFE_componentWillMount()
+ UNSAFE_componentWillUpdate()
+ UNSAFE_componentWillReceiveProps()  

以上这些生命周期被定义为**UNSAFE**，即不安全的。这样做的原因是因为这些生命周期函数在新版本`React`中有可能会被执行多次，与旧版本的`React`表现是不一致的，所以`React`希望将这些不安全的生命周期废弃掉。  

新版本`React`与旧版本`React`相比变化最大的是`React`内部的工作机制从**同步更新**变为**异步可中断的更新**，其中关键到的一个新概念是**优先级**。  

什么是优先级？  

*状态更新*由用户交互产生，用户心里对交互执行顺序有个预期。交互的预期**顺序**为交互产生的状态更新赋予不同**优先级**。  

如：
+ 生命周期函数，是同步执行
+ 用户触发的操作，点击事件、输入事件也是同步执行
+ 交互事件，动画或渲染就需要高优先级执行

用具体的例子来说，最开始用户触发了一个低优先级的更新，当*低优先级更新*正在执行`render`阶段时又触发了一个*高优先级的更新*，那么*高优先级的更新*就会打断*低优先级的更新*，然后从根节点开始执行*高优先级的更新*。如果没有再触发更高优先级的更新，就会等*高优先级的更新*执行完后，再重新执行*低优先级的更新*。  

在这个过程中可以发现*低优先级的更新*会执行两次`render`阶段，而`componentWillXXX`等生命周期函数就是在`render`阶段的`beginWork`中通过调用`updateClassInstance`方法**同步**执行。最终导致这些生命周期函数可能被执行两次，与旧版本的`React`表现（只会被调用一次）不一致。  

所以，新版本`Reac`t将这三个生命周期标记为**UNSAFE**。
