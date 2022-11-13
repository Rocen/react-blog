## useMemo和useCallback

在了解了其他`hook`的实现之后，再来看`useMemo`和`useCallback`的实现就非常简单了。  

这两个`hook`还是分为`mount`和`update`两种情况分别讨论。

## mount

```js
function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // 获取hook
  const hook = mountWorkInProgressHook();
  // 获取依赖项
  const nextDeps = deps === undefined ? null : deps;
  // 获取回调函数的执行结果
  const nextValue = nextCreate();
  // 保存执行结果和依赖项
  hook.memoizedState = [nextValue, nextDeps];
  // 返回执行结果
  return nextValue;
}

function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // 获取hook
  const hook = mountWorkInProgressHook();
  // 获取依赖项
  const nextDeps = deps === undefined ? null : deps;
  // 保存回调函数和依赖项
  hook.memoizedState = [callback, nextDeps];
  // 返回执行结果
  return callback;
}
```
从这段代码可以看到，`mountMemo`和`mountCallback`唯一的区别是：
+ `mountMemo`会将回调函数的**执行结果**作为`value`保存并返回
+ `mountCallback`会将回调函数**本身**作为`value`保存并返回

## update

对于`update`，就是在`mount`的基础上再判断前后依赖项是否改变。
```js
function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | void | null,
): T {
  // 获取hook
  const hook = updateWorkInProgressHook();
  // 获取新的依赖项
  const nextDeps = deps === undefined ? null : deps;
  // 获取前一次的缓存
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      // 获取前一次的依赖项
      const prevDeps: Array<mixed> | null = prevState[1];
      // 判断前后依赖项是否相等
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 如果前后依赖项相等，则不需要重新执行回调函数获取执行结果，直接返回前一次缓存的值
        return prevState[0];
      }
    }
  }
  // 前后依赖项不相等，就需要重新执行回调函数，获取执行结果
  const nextValue = nextCreate();
  // 重新缓存执行结果
  hook.memoizedState = [nextValue, nextDeps];
  //返回执行结果
  return nextValue;
}

function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  // 获取hook
  const hook = updateWorkInProgressHook();
  // 获取新的依赖项
  const nextDeps = deps === undefined ? null : deps;
  // 获取前一次的缓存
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    if (nextDeps !== null) {
      // 获取前一次的依赖项
      const prevDeps: Array<mixed> | null = prevState[1];
      // 判断前后依赖项是否相等
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        // 如果前后依赖项相等，则不需要重新缓存回调函数，直接返回前一次缓存的回调函数
        return prevState[0];
      }
    }
  }
  // 如何前后依赖项不相等，就需要重新缓存回调函数和依赖项
  hook.memoizedState = [callback, nextDeps];
  // 返回回调函数
  return callback;
}
```
由此可见，对于`update`，这两个`hook`的处理的唯一区别也是：回调函数的**执行结果**还是回调函数**本身**作为`value`值缓存和返回。