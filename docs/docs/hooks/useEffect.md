## useEffect

`useEffect`的执行机制可以看[这篇](../hooks/executeUseEffect.md)文章，本节主要介绍`useEffect`的实现原理。  
`useEffect`在`mount`和`update`也分别对应两个不同的方法。

## mount

在`mount`时，会执行`mountEffect`方法。
```js
function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return mountEffectImpl(
      PassiveEffect | PassiveStaticEffect,
      HookPassive,
      create,
      deps,
    );
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps): void {
  // 获取hook
  const hook = mountWorkInProgressHook();
  // 获取依赖项
  const nextDeps = deps === undefined ? null : deps;
  // 为当前fiber节点打上effectTag，表示当前fiber节点上存在useEefect hook
  currentlyRenderingFiber.flags |= fiberFlags;
  // 调用pushEffect返回一个effect
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps,
  );
}
```
从这段代码可以看到，在`mount`时使用`useEffect`，最终会调用`pushEffect`方法：
```js
function pushEffect(tag, create, destroy, deps) {
  // 创建effect，这是useEffect和useLayoutEffect具有的一种数据结构
  const effect: Effect = {
    tag, // 作为标识
    create, // 回调函数
    destroy, // 销毁函数
    deps, // 依赖项
    // Circular
    next: (null: any), // next指针，用于指向下一个effect形成环状链表
  };
  // 获取当前workInProgress fiber.updateQueue属性
  let componentUpdateQueue: null | FunctionComponentUpdateQueue = (currentlyRenderingFiber.updateQueue: any);
  if (componentUpdateQueue === null) {
    // 如果updateQueue为null
    // 初始化一个updateQueue
    // createFunctionComponentUpdateQueue函数返回的结果就是一个对象:{ lastEffect: null }
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    // 再赋值给fiber.updateQueue
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue: any);
    // 将新创建的effect连接到updateQueue上，形成单向环状链表
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    // udateQueue已经初始化过了
    // 则获取lastEffect
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      // lastEffect为null，说明还不存在effect，新创建的effect是第一个effect，它与自己形成环状链表
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      // lastEffect不为null，则将新创建的effec插入到这个环状链表中
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      // lastEffect始终指向最后一个插入的effect
      componentUpdateQueue.lastEffect = effect;
    }
  }
  // 返回这个effect
  return effect;
}
```
从这段代码可以看到，`pushEffect`方法主要做的工作是：首先创建一个`effect`，接着获取`updateQueue.lastEffect`（可能还需要初始化`updateQueue`），然后将创建的`effect`插入到`lastEffect`这条*环状链表*中，最后返回这个`effect`。  

所以`useEffect`或`useLayoutEffect`对应的`hook`数据结构中`memoizedState`保存的其实是`effect`。

## update

在`update`时，会执行`updateEffect`方法。
```js
function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps): void {
  // 获取hook
  const hook = updateWorkInProgressHook();
  // 获取依赖项
  const nextDeps = deps === undefined ? null : deps;
  // 定义销毁函数
  let destroy = undefined;

  if (currentHook !== null) {
    // currentHook不为null，说明当前useEffect属于update
    // 获取上一次保存的effect
    const prevEffect = currentHook.memoizedState;
    // 获取上一次effect的销毁函数
    destroy = prevEffect.destroy;
    if (nextDeps !== null) {
      // 当前依赖项存在
      // 获取到上一次的依赖项
      const prevDeps = prevEffect.deps;
      // areHookInputsEqual内部会遍历nextDeps和prevDeps，然后用 Object.is 方法比较依赖项里面的每个值是否相等
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 如果前后依赖项相等
        // 执行 pushEffect，创建并返回effect
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }
  //  为当前fiber节点打上effectTag，表示当前fiber节点上存在useEefect hook
  currentlyRenderingFiber.flags |= fiberFlags;
  // 执行pushEffect，创建并返回effect
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps,
  );
}
```
从这段代码可以看到，`updateEffect`和`mountEffect`的逻辑很类似，主要的区别在于`updateEffect`需要判断前后依赖项是否相等。如果前后依赖项相等的话，是不需要执行`useEffect`的回调函数。但是令人疑惑的是在代码中这两处的代码好像是一样的，都调用了`pushEffect`方法创建并返回一个`effect`，并看不出有什么区别。  

这就需要注意`pushEffect`函数第一个参数的值了，这是区分是否需要执行回调函数的关键。  
当前后依赖项相同时，第一个参数`hookFlags`参入的值是`HookPassive`。当前前后依赖项不同时，第一个参数传入的是`HookHasEffect | hookFlags`，即`HookHasEffect | HookPassive`。  
而这个参数会通过`pushEffect`方法保存在创建的`effect.tag`属性中。  

`useEffect`是异步调度的，最终会在`layout`阶段通过调用`commitHookEffectListMount`方法执行需要执行的`useEffect`回调函数。  
```js
function commitPassiveMountOnFiber(
  finishedRoot: FiberRoot,
  finishedWork: Fiber,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent: {
      if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        finishedWork.mode & ProfileMode
      ) {
       commitHookEffectListMount(HookPassive | HookHasEffect, finishedWork);
      break;
    }
  }
}
```
从这段代码可以看到，`commitHookEffectListMount`方法的第一个参数传递的是`HookPassive | HookHasEffect`。那么这个参数在`commitHookEffectListMount`方法内如何使用的呢？
```js
function commitHookEffectListMount(tag: number, finishedWork: Fiber) {
  // 获取updatrQueue
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  // 获取最后一个effect
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    // 获取到第一个effect，因为updateQueue是一个单项环状链表，最后一个effect的next指针就指向第一个effect
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    // 遍历这条effect环状链表
    do {
      // **重点**
      if ((effect.tag & tag) === tag) {
        // 执行回调函数
        const create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```
`commitHookEffectListMount`方法内部的代码量还是比较少的，而且逻辑也很清晰，唯一的工作就是遍历`effect`链表并执行对应的回调函数。  

而在执行回调函数之前有一个非常重要的判断，目的就是判断当前遍历到的`effec`是否需要执行对应的回调函数。
```js
(effect.tag & tag) === tag
```
这行代码的目的就是通过函数参数`tag`判断当前遍历到的`effect.tag`是否包含指定的`tag`，而`tag`的值是`HookPassive | HookHasEffect`。  

所以到这里也就解答了上面的疑问，通过`pushEffect`方法来传递不同的参数（`tag`值）来区分是否需要执行回调函数。  

当前后依赖项相同时，`pushEffect`的第一个参数是`HookPassive`。那么当执行`commitHookEffectListMount`方法时，遍历到这个`effect`时，它的`tag`就是`HookPassive`，并不满足`tag`的判断条件，所以不会执行这个`effect`对应的回调函数。  
当前后依赖项不同时，`pushEffec`的第一个参数是`HookHasEffect | HookPassive`。那么当执行`commitHookEffectListMount`方法时，遍历到这个`effect`时，它的`tag`就是`HookHasEffect | HookPassive`，是满足`tag`的判断条件的，所以会执行这个`effect`对应的回调函数。  

## useLayoutEffect

至于`useLayoutEffect hook`与`useEffect hook`在底层实现的方式几乎一致。  

在`mount`时，也是使用`mountEffectImpl`：
```js
function mountLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  let fiberFlags: Flags = UpdateEffect;
  return mountEffectImpl(fiberFlags, HookLayout, create, deps);
}
```
在`update`时，也是使用`updateEffectImpl`：
```js
function updateLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}
```
从上面这两段代码也可以看到，`useLayoutEffect`创建的`effect`上保存的`tag`是`HookLayout`。`HookLayout`和`HookPassive`也是用来区分`useLayoutEffect`和`useEffect`的一种标识。  

在执行回调函数时，调用的方法也是`commitHookEffectListMount`。  



