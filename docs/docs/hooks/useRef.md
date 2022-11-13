## Ref

`ref`是`reference`的缩写。在`React`中，我们通常会用`ref`来保存`DOM`。  

但是，在任何需要被引用的数据时，都可以保存在`ref`中，`useRef`也是将这种用途使用得更加广泛。  

本节主要介绍`useRef`的实现，以及`ref`的工作流程。  

由于`string`类型的`ref`已经不再推荐使用，所以只介绍`function | {current: any}`类型的`ref`。

## useRef

与其他`hook`一样，在`mount`和`update`时，`useRef`都对应两个不同的`dispatcher`。
```js
function mountRef<T>(initialValue: T): {|current: T|} {
  // 获取当前hook
  const hook = mountWorkInProgressHook();
  // 创建ref
  const ref = {current: initialValue};
  hook.memoizedState = ref;
  return ref;
}

function updateRef<T>(initialValue: T): {|current: T|} {
  // 获取当前hook
  const hook = updateWorkInProgressHook();
  // 返回保存的数据
  return hook.memoizedState;
}
```
从这段代码可以看到，`useRef`仅仅是返回了一个具有`current`属性的对象。  

需要说明的是，在`update`时，使用`updateRef`方法会直接返回`memoizedState`。该方法内部并没有使用到`initialValue`这个值，所以在组件更新时想要通过传递的参数改变`ref`的值是没有效果的。  

同样，`createRef`的实现也是如此。  
```js
function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  return refObject;
}
```
其实`useRef`的实现还是很简单的，比较难的地方在与针对`ref`的工作流程。

## ref的工作流程

在`React`中，`HostComponent`、`ClassComponent`、`ForwardRef`都可以赋值`ref`属性。  

其中，`ForwardRef`只是将`ref`作为第二个参数传递下去，并不会进入`ref`的工作流程。  

我们知道`HostComponent`在`commit`阶段的`mutation`阶段执行`DOM`操作。所以，对应`ref`的更新也是发生在`mutation`阶段的。而`mutation`阶段执行`DOM`操作的依据是`effectTag`，所以对于`HostComponent`、`ClassComponent`如果包含`ref`属性，那么也会赋值对应的`Ref effectTag`。
```js
export const Ref = /*                          */ 0b00000000000000100000000;
```
所以，`ref`的工作流程可以分为两部分：
+ `render`阶段，为含有`ref`属性的`fiber`标记`Ref effectTa`g
+ `commit`阶段，为包含`Ref effectTag`的`fiber`执行`ref`操作

## render阶段

在`render`阶段的`beginWork`与`completeWork`中有个同名的方法`markRef`。这个方法用于为含有`ref`属性的`fiber`标记`Ref effectTag`。
```js
// beginWork中的
function markRef(current: Fiber | null, workInProgress: Fiber) {
  // 获取workInProgress fiber的ref属性
  const ref = workInProgress.ref;
  // current === null && ref !== null 说明当前workInProgress fiber是新生成的，属于mount，并且有ref属性
  // current !== null && current.ref !== ref 说明前后fiber的ref属性发生了变化，属于update
  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    // Schedule a Ref effect
    workInProgress.flags |= Ref;
  }
}
// completeWork中的
function markRef(workInProgress: Fiber) {
  workInProgress.flags |= Ref;
}
```
在`beginWork`中，共有两处使用了`markRef`：
+ 对于`ClassComponent`类型，`updateClassComponent`方法中的`finishClassComponent`
+ 对于`HostComponent`类型，`updateHostComponent`方法

在`completeWork`中，有一处使用了`markRef`：
+ `completeWork`中的`HostComponent`类型

组件对应`fiber`被赋值`Ref effectTag`需要满足的条件：
+ 对于`mount`，`workInProgress.ref !== null`，即存在`ref`属性
+ 对于`update`，`current.ref !== workInProgress.ref`，即`ref`属性改变

## commit阶段

在`commit`阶段的`mutation`阶段中，对于`ref`属性改变的情况，需要先移除之前的`ref`，调用的方法是`commitDetachRef`。
```js
function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      // function类型的ref
      currentRef(null);
    } else {
      // 对象类型的ref
      currentRef.current = null;
    }
  }
}
```
然后，在`mutation`阶段，对于`Deletion effectTag`的`fiber`节点，需要递归它的子树，对子孙`fiber`节点的`ref`执行类似`commitDetachRef`的操作。  
```js
function safelyDetachRef(current: Fiber) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref === 'function') {
      try {
        ref(null);
      } catch (refError) {
        // 捕获执行function类型ref的时候抛出的错误
        captureCommitPhaseError(current, refError);
      }
    } else {
      ref.current = null;
    }
  }
}
```
接下来，进入`commit`阶段的`layout`阶段，执行`ref`的赋值操作。
```js
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    // 获取workInProgress fiber对应的真实DOM节点
    const instance = finishedWork.stateNode;
    let instanceToUse;
    // 确保存在真实DOM节点
    switch (finishedWork.tag) {
      case HostComponent:
        // 也是使用instance
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }
    // 赋值instance
    if (typeof ref === 'function') {
      ref(instanceToUse);
    } else {
      ref.current = instanceToUse;
    }
  }
}
```
## 总结

`ref`的主要工作流程：
+ 对于`FunctionComponent`，`useRef`负责创建并返回一个对象作为`ref`使用
+ 对于赋值了`ref`属性的`HostComponent`和`ClassComponent`，会在`render`阶段经历标记`Ref effectTag`，`commit阶段`执行重置`ref`和赋值`ref`的操作