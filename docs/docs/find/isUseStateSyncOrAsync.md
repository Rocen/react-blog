## useState是同步还是异步

`useState`是同步还是异步？这应该是一个老生常谈的问题了，或许每个`React`开发者也都听说过这个问题。这对于考察`React`开发者是否了解`useState`底层的运行原理算是一个很好的问题。不知道各位是否知道并且理解答案呢？

如果排除法也可以得到答案，视为一道选择题，不是选择同步就是选择异步，而且如果是同步的话可能也就不会出现这种问题了，那么正确答案只有一个：**异步**！  

因为这个问题涉及到的是`React`源码对于`useState`运行机制的原理，如果不了解`React`源码的话，很难真正的理解为什么`useState`是异步的。  

接下来就让我们从源码的角度去探究造成这种现象的原因是什么。

::: tip
为了描述的准确性，`const [state, setState] = useState(initialState)`这里`useState`是指`useState Hook`，而`setState`是指`useState`返回的第二参数，即更新`state`的函数。
:::

## 前置知识

在`React`开发中，通过使用`setState`或`this.setState`来修改`state`进而造成组件更新的行为被称为**触发状态更新**。那么这种**触发状态更新**所*具象化*的数据结构被称为`Update`。
```js
    const update: Update<S, A> = {
        lane, // update本身具有的优先级，当存在多个update时，高优先级的update会被优先计算，低优先级的update可能会被跳过而之后计算
        action, // 通过setState方法传入的参数，可以为一个值，也可以为一个函数
        eagerReducer: null, // 迫切的reducer，通常为basicStateReducer，暂时可不关注
        eagerState: null,   // 迫切的state，通常为更新时的一个值，暂时可不关注
        next: (null: any),  // 指针，用于指向下一个update，多个update会连接形成单向环状链表，这个链表被保存在hook.queue.pending上
    };
```
由此可见，`update`作为触发状态更新具象化的数据，保存了本次更新的相关内容。最终会在`updateReducer`函数中被计算并得到最终的结果，即新的`state`。新的`state`会被保存到`hook.memeoizedState`属性上。

## 回调函数的执行

在事件系统中学习了通过`React`合成事件注册的回调函数是如何执行的，而且毫无疑问回调函数内部的代码通常情况下也是**同步执行**的。  

但是当在这个回调函数里面使用了`setState`或`this.setState`等触发状态更新的方法就会进入`React`内部的更新流程里面执行相应的操作。所以我们就需要着重了解这些触发状态更新的方法做了什么，又是如何造成了**异步执行**的特性。

## useState

需要说明一下`React`对于`Hooks`实现一些特性。（详细的介绍可以看[这篇](../hooks/useStateAnduseReducer.md)文章）  

首先，`Hooks`会通过`ReactCurrentDispatcher`变量来记录当前的使用的`Hooks`集合。而这个变量可能的取值是`HooksDispatcherOnMount`或`HooksDispatcherOnUpdate`。这两个变量用来区分当前组件是处在`mount`还是`update`。  

如果是`mount`就会赋值`HooksDispatcherOnMount`，而如果是`update`就赋值`HooksDispatcherOnUpdate`。目的是在不同的阶段可以执行正确阶段的方法。  

我们先看下`useState Hook`的实现：
```js
const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
};

const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
};

function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
    // 创建一个hook
    const hook = mountWorkInProgressHook();
    if (typeof initialState === 'function') {
        // $FlowFixMe: Flow doesn't like mixed types
        initialState = initialState();
    }
    // 赋值memoizedState
    hook.memoizedState = hook.baseState = initialState;
    // 初始化queue
    const queue = (hook.queue = {
        pending: null,
        interleaved: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: (initialState: any),
    });
    // 赋值dispatch
    const dispatch: Dispatch<
        BasicStateAction<S>,
    > = (queue.dispatch = (dispatchAction.bind(
        null,
        currentlyRenderingFiber,
        queue,
    ): any));
    // 返回state值和dispatch方法
    return [hook.memoizedState, dispatch];
}

function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
    // 执行updateReducer方法，并返回调用结果
    return updateReducer(basicStateReducer, (initialState: any));
}
```
从这段代码可以看出，`FunctionComponent`中使用的`useState`在`mount`和`upadte`分别对应着不同的函数。  

我们先看下`mountState`的代码。
```js
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
    // 创建一个hook
    const hook = mountWorkInProgressHook();
    if (typeof initialState === 'function') {
        // $FlowFixMe: Flow doesn't like mixed types
        initialState = initialState();
    }
    // 赋值memoizedState
    hook.memoizedState = hook.baseState = initialState;
    // 创建queue，通过dispatchAction触发的状态更新update连接到queue.pending上，并通过环状链表的结构保存
    const queue = (hook.queue = {
        pending: null,
        interleaved: null,
        lanes: NoLanes,
        dispatch: null,
        lastRenderedReducer: basicStateReducer,
        lastRenderedState: (initialState: any),
    });
    // dispatchAction，暴露出去通过setState使用的就是这个dispatchAction方法
    const dispatch: Dispatch<
        BasicStateAction<S>,
    > = (queue.dispatch = (dispatchAction.bind(
        null,
        currentlyRenderingFiber,
        queue,
    ): any));
    // 返回state值和dispatch方法
    return [hook.memoizedState, dispatch];
}

function mountWorkInProgressHook(): Hook {
    // 创建hook
    const hook: Hook = {
        // 本次更新后最新的state
        memoizedState: null,
        // 基础的state，作为一个中间值用来保存计算过程中的state和update链表
        baseState: null,
        baseQueue: null,
        // 保存本次更新中触发的update链表
        queue: null,
        // 多个hook会通过next指针连接，形成单项链表
        next: null,
    };
    // 当前还没有正在执行的hook
    if (workInProgressHook === null) {
        // workInProgressHook变量代表当前正在执行的hook
        // currentlyRenderingFiber变量代表当前执行的Fiber
        // currentlyRenderingFiber.memoizedState保存的是组件中的第一个hook，多个hook会通过next指针形成单线链表
        currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
    } else {
        // 当前已经有正在执行的hook，就需要赋值给workInProgressHook.next，作为下一个hook使用
        workInProgressHook = workInProgressHook.next = hook;
    }
    // 返回当前正在执行的hook
    return workInProgressHook;
}

function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
    // 获取优先级
    const eventTime = requestEventTime();
    const lane = requestUpdateLane(fiber);
    // 创建update，保存了本次状态更新的相关内容
    const update: Update<S, A> = {
        lane, // 优先级
        action, // 调用setState传入的第一个参数，可能是一个值，也可能是一个函数
        eagerReducer: null, // 特定情况下，用来做优化使用的值
        eagerState: null,   // 特定情况下，用来做优化使用的值
        next: (null: any),  // 指针，用来与其他update连接，形成环状链表
    };

    const alternate = fiber.alternate;
    if (
        fiber === currentlyRenderingFiber ||
        (alternate !== null && alternate === currentlyRenderingFiber)
    ) {
        // some code...
    } else {
        if (isInterleavedUpdate(fiber, lane)) {
            // some code...
        } else {
            // 取到hook.queue.pending
            const pending = queue.pending;
            // 此时，pending上还没有update
            if (pending === null) {
                // 将update的指针指向自己，自己与自己形成环状链表
                update.next = update;
            } else {
            // pending上存在多个update
                // 因为queue.pending始终指向最后一个update，那么环状链表的最后一个update.next指针就指向第一个update
                // 所以将当前update.next指向第一个update
                update.next = pending.next;
                // 再将前一个update.next指向当前update
                pending.next = update;
            }
            // queue.penging始终指向最后一个插入的update
            queue.pending = update;
        }
        // 当前是mount阶段之后的第一个update阶段，并且当前触发的update是该组件中的第一个hook的第一个update
        if (
            fiber.lanes === NoLanes &&
            (alternate === null || alternate.lanes === NoLanes)
        ) {
        // 当满足如上情况的时候，setState会立刻执行
        // 这也说明在这种情况下，setState会变成同步的
        const lastRenderedReducer = queue.lastRenderedReducer;
        if (lastRenderedReducer !== null) {
            try {
                const currentState: S = (queue.lastRenderedState: any);
                // 立即计算通过setState传入的reducer
                // lastRenderedReducer就是basicStateReducer
                const eagerState = lastRenderedReducer(currentState, action);
                
                update.eagerReducer = lastRenderedReducer;
                update.eagerState = eagerState;
                // 当新的state和旧的state值相等时会直接return掉，不用开启一次状态更新，用来做性能优化
                if (is(eagerState, currentState)) {
                    return;
                }
            } catch (error) {
                // ...
            } finally {
                // ...
            }
        }
        }
        // 开启状态更新
        const root = scheduleUpdateOnFiber(fiber, lane, eventTime);

        // some code...
    }
}

function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // 通过什么方式计算state，如果参数是一个函数则执行它
  // 如果不是函数则说明是一个具体的值，直接返回这个值
  return typeof action === 'function' ? action(state) : action;
}
```
`mountState`只负责创建并初始化`Hook`，所以实现还是比较简单的。  

那我们再看下`updateState`即`updateReducer`又做了哪些事情：
```js
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
    // 获取当前的hook
    const hook = updateWorkInProgressHook();
    // 获取queue
    const queue = hook.queue;

    queue.lastRenderedReducer = reducer;
    // currentHook是current Fiber上memoizedState保存的hook链表
    // 通过updateWorkInProgressHook取到的hook是workInProgress Fiber上memoizedState保存的hook链表
    const current: Hook = (currentHook: any);


    let baseQueue = current.baseQueue;

    // workInProgress hook上的queue.pending存在update
    const pendingQueue = queue.pending;
    if (pendingQueue !== null) {
        // We have new updates that haven't been processed yet.
        // We'll add them to the base queue.
        if (baseQueue !== null) {
            // 合并baseQueue和pendingQueue
            const baseFirst = baseQueue.next;
            const pendingFirst = pendingQueue.next;
            // 将baseQueue.next指向pendingQueue的第一个update，即baseQueue的尾部连接到pendingQueue的首部
            baseQueue.next = pendingFirst;
            // 将pendingQueue.next指向baseQueue的第一个update，即pendingQueue的尾部连接到baseQueue的首部
            pendingQueue.next = baseFirst;
        }
        // 再将pendingQueue上需要计算的update保存到baseQueue中，等待计算
        current.baseQueue = baseQueue = pendingQueue;
        // 清空
        queue.pending = null;
    }

    if (baseQueue !== null) {
        // 取到第一个update
        const first = baseQueue.next;
        // 取到基础的state，存在的update都会以baseState作为基础值计算
        let newState = current.baseState;

        let newBaseState = null;
        let newBaseQueueFirst = null;
        let newBaseQueueLast = null;
        let update = first;
        // 计算baseQueue上存在的update
        do {
            const updateLane = update.lane;
            // 处理在更新时又触发的更新，属于特殊情况
            if (!isSubsetOfLanes(renderLanes, updateLane)) {
                
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

                currentlyRenderingFiber.lanes = mergeLanes(
                    currentlyRenderingFiber.lanes,
                    updateLane,
                );
                markSkippedUpdateLanes(updateLane);
            } else {
                // 当前update有足够的优先级

                // 在这个update之前存在因为优先级较低而跳过的update，那么需要将当前的update克隆一份并连接到跳过的update之后
                // 这是因为多个update可能存在依赖性，后一个update需要依赖前一个update计算后的state作为基础
                // 所以，当存在优先级较低而被跳过的update，当下次计算这个update时，需要一起计算这个update及之后连续的多个update
                // 这是基于优先级的一种特性
                if (newBaseQueueLast !== null) {
                    const clone: Update<S, A> = {
                        lane: NoLane,
                        action: update.action,
                        eagerReducer: update.eagerReducer,
                        eagerState: update.eagerState,
                        next: (null: any),
                    };
                    // 保存跳过update的链表
                    newBaseQueueLast = newBaseQueueLast.next = clone;
                }

                // 计算update
                if (update.eagerReducer === reducer) {
                    // 在dispatchAction中已经计算过了，就直接取计算过的值
                    newState = ((update.eagerState: any): S);
                } else {
                    // 通过reducer计算新的state
                    // reducer就是basicStateReducer
                    // 如果action是一个值就返回这个值，如果是一个函数就将旧的state作为参数传入并执行这个函数
                    const action = update.action;
                    newState = reducer(newState, action);
                }
            }
            // 因为update用链表连接的，通过移动next指针就能取到下一个update
            update = update.next;
            // 当update计算完了
        } while (update !== null && update !== first);

        // 当新产生的update或者被跳过的update，newBaseQueueLast就为null，说明update都计算完了
        if (newBaseQueueLast === null) {
            newBaseState = newState;
        } else {
        // 说明有新产生的update或者被跳过的update，就将剩下的update作为下次的baseQueue等待计算
            newBaseQueueLast.next = (newBaseQueueFirst: any);
        }

        // Mark that the fiber performed work, but only if the new state is
        // different from the current state.
        if (!is(newState, hook.memoizedState)) {
            markWorkInProgressReceivedUpdate();
        }
        // 赋值memoizedState
        hook.memoizedState = newState;
        // 赋值baseState
        hook.baseState = newBaseState;
        // 赋值baseQueue
        hook.baseQueue = newBaseQueueLast;

        queue.lastRenderedState = newState;
    }
    // 取到queue中保存的dispatch
    const dispatch: Dispatch<A> = (queue.dispatch: any);
    // 返回新的state和dispatch
    return [hook.memoizedState, dispatch];
}
```
`updateReducer`方法主要的工作就是基于`baseState`和`baseQueue`计算`queue`中有足够优先级的`update`，最后将计算的结果`state`值返回给组件。   

虽然工作流程比较简单，但是因为需要考虑一些特殊情况，如果本轮更新中又触发了更新，就需要特殊处理这种情况。再就是当有低优先级的`update`被跳过后，在下次计算时，会计算这个被跳过的`update`之后所有的`update`。这样做的目的是考虑到连续的`update`之间存在依赖关系。如果使用函数形式的传参，后一个`useState`传入的参数就需要依赖前一个`useState`的计算结果。  

以上这部分只是介绍了`useState`在`mount`和`update`时都做了哪些工作，那么这与`setState`的执行方式又有什么关联呢？这个时候就需要了解`setState`会在什么时候执行。  

`useState`或者说所有的`Hooks`都会在`renderWithHooks`这个函数里面执行，而`renderWithHooks`函数最主要的工作是执行`FunctionComponent`对应的函数，来实现组件的渲染。
```js
function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
    renderLanes = nextRenderLanes;
    // 赋值当前执行渲染的fiber
    currentlyRenderingFiber = workInProgress;
    // 初始化
    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;
    workInProgress.lanes = NoLanes;
    // 赋值dispatcher，是mount阶段还是update阶段
    ReactCurrentDispatcher.current =
        current === null || current.memoizedState === null
            ? HooksDispatcherOnMount
            : HooksDispatcherOnUpdate;
    // 执行组件，完成渲染
    let children = Component(props, secondArg);
    // 重置全局变量
    ReactCurrentDispatcher.current = ContextOnlyDispatcher;

    renderLanes = NoLanes;
    currentlyRenderingFiber = (null: any);

    currentHook = null;
    workInProgressHook = null;

    didScheduleRenderPhaseUpdate = false;

    // some code...

    // 返回children
    return children;
}
```
在`renderWithHooks`方法中通过`Component`这个变量来执行`FunctionComponent`组件本身时，在`FunctionComponent`内部使用的`useState`会被赋值为`updateReducer`，所以`updateReducer`函数就会在`Component`执行时被间接执行。而`updateReducer`的工作就是根据`setState`传入的参数`action`而计算`update`，那么`action`也就会在这时被**执行**。  

现在我们终于理清了`useState`在`update`时的整个工作流程。那么看了如此繁多又复杂的代码和本文的题目有什么关系呢？只有弄清楚了`useState`暴露给外部的`dispatch`方法和作为参数的`action`在什么时候执行，才能彻底理解`useState`的执行机制。  

在事件系统一文中我们了解了通过`React`合成事件注册的回调函数会调用`dispatchEvent`这个函数通过先收集监听器再以*批量更新*的方式来执行回调函数。所以在回调函数中的**同步代码**都会在这时执行，其中也包括`dispatch`这个函数。没错，`dispatch`函数即`useState`的第二个参数会在这时**同步执行**。但是，虽然`dispatch`函数会在这时执行，但是它只负责创建`update`对象并插入到当前`hook`的`queue.pending`上，并没有进行计算`update`和执行`action`。在函数的最后会调用`scheduleUpdateOnFiber`开启调度更新。  

当通过`scheduleUpdateOnFiber`开启调度更新之后会进入一次`React`完整的状态更新流程。在`render`阶段，`beginWork`中处理`FunctionComponent`就会调用`renderWithHooks`函数来完成组件的渲染，然后根据渲染的结果`children`创建子`Fiber`节点。只有在`renderWithHooks`内部执行`Component`的时候，接着调用`updateReducer`来计算当前`hook`上保存的`update`时，才会真正执行`action`。   

单纯通过文字描述比较晦涩，可以结合下面的代码理解：
```js
function App() {
    const [num, setNum] = useState(0);

    const handleClick = () => {
        console.log('before...');
        setNum((num) => {
            console.log('among...')
            return num + 1; 
        })
        console.log('after...');
    }

    return (<div onClick={handleClick}>{num}</div>)
}

// 触发点击事件，输出
before...
after...
among...
```
触发点击事件后，会在事件系统中同步执行注册的回调函数`handleClick`，所以会在此时输出*before...*和*after...*。然后`setNum`触发状态更新，通过`dispatchAction`开启调度更新。之后在`render`阶段的`beginWork`中，根据`FunctionComponent`调用`updateFunctionComponent`方法，在这个方法内部又调用`renderWithHooks`执行组件的渲染。在组件渲染时，会执行`updateReducer`方法。这个方法会计算`update`，计算方式是通过执行`action`（setNum中的回调函数）获得返回结果，所以会在此时输出*among...*。  

虽然，我们都知道`setState`是**异步执行**的，但是也有特殊情况。只有第一次更新的第一个`action`是**同步执行**的，其余的`action`都是**异步执行**的。  

但是这种**异步**并不是广义上的**异步**，因为它和同步代码只是执行上存在**先后顺序**，并没有利用到**回调函数**这种执行方式。而且这种**先后顺序**也是`React`有意而为之的，目的是在一次更新中如果触发了多个状态更新，那么通过这种更新**延迟执行**的特性和**批量更新**的共同作用，**多个状态更新**会被**合并**到一次状态更新流程中，从而避免了每个状态更新都会触发各自的状态更新流程。这样做的结果就是组件只会渲染一次，达到**性能优化**的目的。

## 总结

通常来讲，当`FunctionComponent`在`update`时，根据`React`合成事件的回调函数**同步执行**作为判断标准，`useState`的`dispatch`会**同步执行**，但是`action`会**异步（准确的说是伪异步）执行**。