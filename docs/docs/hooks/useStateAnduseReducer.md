## useState和useReducer

之前在状态更新一节介绍了`ClassComponent`和`HostRoot`类型的状态更新方式，接下来再一起看下`FunctionComponent`类型的状态更新方式。
`useState`和`useReducer`都是在`FunctionComponent`中可以触发状态更新的`hooks`。

## Dispatcher

在与`Hooks`相关的源码中有一个非常重要的概念或者说是变量，就是`dispatcher`。  

在`Hooks`中，组件`mount`时的`hook`与`update`时的`hook`来源于不同的对象，这类对象在源码中被称为`dispatcher`。  
以下`dispatcher`在源码中是怎么定义：
```js
const HooksDispatcherOnMount: Dispatcher = {
  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  // ,,,
};

const HooksDispatcherOnUpdate: Dispatcher = {
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  // ...
};

const ContextOnlyDispatcher: Dispatcher = {
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  // ...
};
```
从这段代码可以看出，`Dispatcher`一共有三种类型，通常对应了三个变量。而从这三个变量的命名应该大致可以猜到他们的用途了。  

`FunctionComponent`在`mount`时会使用`HooksDispatcherOnMount`中属于`mount`阶段的处理函数，而在`update`时会使用`HooksDispatcherOnUpdate`中属于`update`阶段的处理函数。  

在`FunctionComponent render`前，会根据`FunctionComponent`对应`fiber`的以下条件来区分`mount`和`update`：  
```js
ReactCurrentDispatcher.current =
  current === null || current.memoizedState === null
    ? HooksDispatcherOnMount
    : HooksDispatcherOnUpdate;  
```
`ReactCurrentDispatcher`是一个全局变量，用来保存`mount`和`update`时对应的`dispatcher`。  

其中`current`变量表示的就是`current Fiber`。如果`current === null`就表示当前还没有`current Fiber`，说明此时是`FunctionComponent`的第一次渲染，对应就是`mount`。  

当在`FunctionComponent`中声明了`hooks`，这些`hook`会组成单项链表的结构保存在`fiber.memoizedState`属性上。所以通过`current fiber.memoizedState === null`就可以判断当前这个`Fiber`上还不存在`hook`，所以也是`mount`。  

如果不存在上述两种情况就说明不是`mount`而是`update`。那么就需要使用`update`对应的处理函数了。  

还有一种抛出异常的`dispacher：ContextOnlyDispatcher`。`ContextOnlyDispatcher`就是为了保证在`FunctionComponent`中使用`hooks`的方式是正确的。  

那么`ContextOnlyDispatcher`会在什么时候赋值给`ContextOnlyDispatcher`的呢？  
```js
// 简化后
function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {

  ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;

  let children = Component(props, secondArg);

  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

}
```
我们知道在`render`阶段对于`FunctionComponent`会通过调用`renderWithHooks`方法来实现组件的渲染，而在实现组件渲染之前会赋值`ReactCurrentDispatcher`变量来确保在执行`FunctionComponent`时，组件内使用的`hooks`都属于正确的处理函数。而在组件渲染完成之后就会将`ReactCurrentDispatcher`赋值为`ContextOnlyDispatcher`。  

可以考虑如下情况：
```js
useEffect(() => {
  useState(0);
})
```
`useEffect`因为属于顶层的`hook`，所以在组件渲染时会使用正确的处理函数（`mountEffect`或`updateEffect`）。  

而`useState`被使用在了`useEffect`的回调函数中，在执行组件渲染的时候不会被执行，会跟随`useEffect`的回调函数在`layout`阶段之后再异步执行。等到通过回调函数执行`useState`时，此时全局变量`ReactCurrentDispatcher`的值已经是`ContextOnlyDispatcher`，导致`useState`对应的处理函数就是`throwInvalidHookError`方法。所以在调用`throwInvalidHookError`方法就会抛出异常，来警告开发者`Hooks`的使用方式是不正确的。

## Hooks的数据结构

在学习`hooks`之前还需要了解`hook`在源码中是如何定义的。
```js
const hook: Hook = {
  memoizedState: null, // 用来保存hook中的变量，如果是useState或useReducer的话，memoizedState保存的就是state的值

  // 与ClassComponent和HostRoot类型的updateQueue结构类似
  baseState: null, // baseState
  baseQueue: null, // firstBaseUpdate和update.lastBaseUpdate
  queue: null, // shared.pending

  next: null, // 指针，用来指向下一个hook
};
```
## 工作流程

以如下代码作为示例：
```js
function App() {
    const [num, setNum] = useState(0);

    return (
        <div>
            <button onClick={() => setNum(num => num + 1)}>{num}</button>
        </div>
    )
}
```
`useState`和`useReducer`的工作流程可以分为两部分：
+ 声明阶段：组件渲染时，会执行`useState`或`useReducer`方法
+ 调用阶段：触发点击事件，调用`setNum`方法而触发状态更新

## 声明阶段

在执行组件渲染时，会调用`renderWithHooks`方法。该方法会执行`FunctionComponent`来完成组件的渲染。此时遇到`useState`的话，就会进入声明阶段。  

在`mount`时，`useState`会通过`HooksDispatcherOnMount`调用`mountState`方法。
```js
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // 创建hook
  const hook = mountWorkInProgressHook();
  // 判断initialState的类型
  if (typeof initialState === 'function') {
    // 如果initialState是函数的话，则需要执行这个函数获取执行结果
    initialState = initialState();
  }
  // 保存initialState
  hook.memoizedState = hook.baseState = initialState;
  // 创建queue
  const queue = (hook.queue = {
    pending: null, // 通过dispatch创建的update会通过环状链表的形式保存在pending上
    lanes: NoLanes, // 优先级
    dispatch: null, // 保存dispatchAction.bind()的值
    lastRenderedReducer: basicStateReducer, // 上一次render时使用的reducer
    lastRenderedState: (initialState: any), // 上一次render时的state
  });
  // 赋值dispatch
  const dispatch: Dispatch<
    BasicStateAction<S>,
  > = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  // 返回结果
  return [hook.memoizedState, dispatch];
}

function mountWorkInProgressHook(): Hook {
  // 创建hook
  const hook: Hook = {
    memoizedState: null,

    baseState: null,
    baseQueue: null,
    queue: null,

    next: null,
  };
  // workInProgressHook是一个全局变量，用来保存当前正在执行的hook
  if (workInProgressHook === null) {
    // 当workInProgressHook为null，说明当前创建的hook是第一个hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 将创建的hook连接在workInProgressHook链表的末尾
    // 并重新赋值workInProgressHook
    workInProgressHook = workInProgressHook.next = hook;
  }
  // 返回
  return workInProgressHook;
}
```
从这段代码可以看到，`mountState`方法的逻辑比较简单，主要做的就是初始化的工作。  

其中`basicStateReducer`方法如下：
```js
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  return typeof action === 'function' ? action(state) : action;
}
```
由此可见，`useState`是预置了`reducer`的`useReducer`，而这个预置的`reducer`是`basicStateReducer`。
```js
function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  return updateReducer(basicStateReducer, (initialState: any));
}
```
由此可见，在`update`时，`useState`其实调用的就是`updateReducer`。
```js
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // 获取hook
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  // 重新赋值lastRenderedReducer
  queue.lastRenderedReducer = reducer;

  const current: Hook = (currentHook: any);

  // 以下这部分逻辑与update和updateQueue几乎一致
  let baseQueue = current.baseQueue;

  // 获取pendingQueue
  const pendingQueue = queue.pending;
  // 存在需要计算的update
  if (pendingQueue !== null) {
    // baseQueue不为null，说明之前存在被跳过的update
    if (baseQueue !== null) {
      // 将pendingQueue这条环状链表剪开，连接到baseQueue上
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    // 赋值一份baseQueue保存到current fiber上
    current.baseQueue = baseQueue = pendingQueue;
    // 重置pending
    queue.pending = null;
  }
  // 计算update
  if (baseQueue !== null) {
    // 取到第一个update
    const first = baseQueue.next;
    // 取到baseState
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateLane = update.lane;
      // 当前update因为优先级不够而被跳过
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // 克隆update，并保存到newBaseQueue中
        const clone: Update<S, A> = {
          lane: updateLane,
          action: update.action,
          eagerReducer: update.eagerReducer,
          eagerState: update.eagerState,
          next: (null: any),
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        // 合并优先级
        currentlyRenderingFiber.lanes = mergeLanes(
          currentlyRenderingFiber.lanes,
          updateLane,
        );
      } else {
        // 当前的update有足够的优先级，可以计算

        if (newBaseQueueLast !== null) {
          // newBaseQueueLast不为null，说明已经存在被跳过的update，为了保证依赖关系的正确，被跳过的update之后所有的update都要被计算
          const clone: Update<S, A> = {
            lane: NoLane,
            action: update.action,
            eagerReducer: update.eagerReducer,
            eagerState: update.eagerState,
            next: (null: any),
          };
          // 连接到newBaseQueue上
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }

        // 计算update
        if (update.eagerReducer === reducer) {
          // eagerState会被提前计算，如果已经计算了eagerState，则直接使用
          newState = ((update.eagerState: any): S);
        } else {
          // 从update中取到参数action
          const action = update.action;
          // 执行reducer得到新的state
          newState = reducer(newState, action);
        }
      }
      // 移动next指针，取到下一个update
      update = update.next;
    } while (update !== null && update !== first);
    // 如果不存在被跳过的update
    if (newBaseQueueLast === null) {
      // newBaseState就是newState，否则newBaseState是被跳过的update它所对应的newState
      newBaseState = newState;
    } else {
      // 如果存在被跳过的update，将newBaseQueue连成环状链表
      newBaseQueueLast.next = (newBaseQueueFirst: any);
    }
    // 赋值memoizedState
    hook.memoizedState = newState;
    // 最终被跳过的update对应的newBaseState会赋值给baseState
    hook.baseState = newBaseState;
    // 被跳过的update队列
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  // 返回memoizedState和dispatch
  return [hook.memoizedState, dispatch];
}
```
整个流程可以概括为：
> 找到对应的hook，根据update计算该hook对应的新的state并返回

```js
function updateWorkInProgressHook(): Hook {
  let nextCurrentHook: null | Hook;
  // currentHook是一个全局变量，通常指current fiber上的hook
  if (currentHook === null) {
    // 当currentHook为null，说明此时是update时第一次进入该函数，因为每次调用完renderWithHooks方法，currentHook会置为null
    // 通过workInProgress fiber.alternate属性取到current fiber
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      // 存在current fiber
      // 将current fiber上第一个hook赋值给nextCurrentHook
      nextCurrentHook = current.memoizedState;
    } else {
      // 不存在current fiber
      // nextCurrentHook为null
      nextCurrentHook = null;
    }
  } else {
    // currentHook不为null，说明不是update时第一次进入该函数
    // 则currentHook有值，取下一个currenHook
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook: null | Hook;
  // workInProgressHook是一个全局变量，用来记录当前正在执行的hook
  if (workInProgressHook === null) {
    // 当workInProgressHook为null，说明当前没有正在执行的hook，所以应该从第一个hook开始执行，即workInProgress fiber.memoizedState
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    // 否则移动next指针，寻找下一个workInProgressHook
    nextWorkInProgressHook = workInProgressHook.next;
  }
  
  if (nextWorkInProgressHook !== null) {
    // nextWorkInProgressHook有值
    // 赋值workInProgressHook
    workInProgressHook = nextWorkInProgressHook;
    // 移动next指针，取到下一个workInProgressHook
    nextWorkInProgressHook = workInProgressHook.next;
    // 赋值currentHook
    currentHook = nextCurrentHook;
  } else {
    // nextWorkInProgressHook没有值
    // 赋值currentHook
    currentHook = nextCurrentHook;
    // 从currentHook上复制一个hook
    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,

      next: null,
    };

    if (workInProgressHook === null) {
      // 当workInProgressHook为null
      // 复制的新hook作为workInProgressHook的值
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // 当workInProgressHook不为null
      // 将这个复制的新hook连接到workInProgressHook链表的末尾
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}
```
从这段代码可以看到，当组件在`update`时获取`hook`方式是通过移动`workInProgress`构成的链表上的`next`指针获得的。而`workInProgress`构成的单项链表决定了各个`hook`存在顺序是固定的，所以这也是为什么在组件中使用`hook`时的一大限制就是不可以用在*条件语句*中。  

因为如果在条件语句中使用了`hook`，那么在`update`时就会打乱了`hook`之间的顺序关系，而各个`hook`结构中保存的数据结构也不一样，自然就无法混用了。  

## 调用阶段

调用阶段通常是在我们使用`useState`暴露出来的`dispatch`方法，所以当我们使用了`dispatch`方法就会进入调用阶段。而这个`dispatch`方法对应的就是`dispatchAction`函数：
```js
// 简化后的代码
function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  // 优先级相关
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(fiber);
  // 创建update
  const update: Update<S, A> = {
    lane, // 优先级
    action, // 指就是在使用dispatch方法时传入的参数，基础类型或函数
    eagerReducer: null, // 特定情况下的优化字段
    eagerState: null, // 特定情况下的优化字段
    next: (null: any), // 指针，指向下一个update，由此形成环状链表
  };
  // 取到与workInProgress fiber通过alternate属性连接的fiber
  const alternate = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
    // render阶段触发的更新...
  } else {
    // 取到pending
    const pending = queue.pending;
    if (pending === null) {
      // 当pending为null时，说明还不存在update，此时创建的update是第一个update，所以这个update需要与自己连接形成环状链表，所以next指针指向自己
      update.next = update;
    } else {
      // 当pending不为null，说明已经存在一个以上的update，所以将update插入到这条环状链表中
      update.next = pending.next;
      pending.next = update;
    }
    // queue.pending始终指向最后一个插入的update
    queue.pending = update;

    // eagerState相关的优化逻辑...

    // 调度状态更新
    const root = scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
}
```
从这段代码可以看到，`dispatchAction`方法主要做的工作就是创建`update`，并将`update`插入到`queue.pending`构成的环状链表中，然后开启调度状态更新。  

其中与`eagerState`相关的优化逻辑的详细介绍可以看[这篇](../find/performanceOptimize.md)文章。  

## 总结

`useState`和`useReducer`的工作流程可以分为两步：
+ 声明阶段：组件渲染时，会执行`useState`或`useReducer`方法
+ 调用阶段：调用`dispatch`方法而触发状态更新

并且`useState`和`useReducer`在源码实现上可以说非常相似，区别在于`useState`是`React`内置了`reducer`方法，而`useReducer`可以自定义`reducer`方法。