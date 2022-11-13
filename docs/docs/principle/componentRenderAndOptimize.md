## 组件渲染

在`React`中主要使用的组件分为`ClassComponent`和`FunctionComponent`两种。且在`Hooks`配合`FunctionComponent`大量使用之前，`FunctionComponent`的唯一用途就是UI组件即无状态组件。那么什么是无状态组件呢？

无状态组件就是只负责页面的渲染，不做其他复杂逻辑操作的组件就是无状态组件。无状态组件并不是被定义为它应该是无状态的，而是`FunctionComponent`独特的渲染方式造成了这样的结果。而在这之后，`React`推出了新的编写组件的方式，就是`FunctionComponent`和`Hooks`的组合，并且这种组合践行的理念是`代数效应`。

## 代数效应

代数效应是什么？代数效应是函数式编程的一个概念，用于将*副作用*从函数中分离，使函数关注点保持**存粹**。  

那么代数效应与`React`有什么关系呢？最明显的一个例子就是Hooks。  

在有了`useState`，`useReducer`，`useRef`这样的`Hooks`，我们就不需要关注在`FunctionComponent`中如何保存`state`，这些`React`会为我们处理。

## 函数组件的渲染

我们说的组件渲染就是执行组件获取`JSX`语法通过`React.createElement`返回的`React Element`。  

那么函数组件渲染的特点就是函数的执行导致函数内定义的变量和函数都会被**重新声明**和**赋值**，导致无法对这些变量和函数进行有效的操作。  

所以，为了解决这种问题就需要使用`Hooks`配合函数组件进行开发了。  

如代码所示：
```js
function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
    // order code...

    let children = Component(props, secondArg);
    // order code...

    return children;
}
```
在`beginWork`中对于`FunctionComponent`类型的组件最终会调用`renderWithHooks`方法获取函数组件的执行结果`React Element`，进而生成对应的`Fiber`节点。  

值得注意的是，在`renderWithHooks`内部并没有其他性能优化的手段来控制组件是否执行渲染。也就是说，从函数组件自身的角度来看，只有`useState`的返回函数`dispatchAction`中在**特定情况**下会对*旧新state*进行**浅比较**。比较结果相等的话，就不会开启调度更新，从而避免不必要的更新。

## 类组件的渲染

类组件渲染的方式就是调用`this.render`方法获取返回结果`React Element`，这过程也伴随着一系列的生命周期函数的执行。  

如代码所示：
```js
function updateClassInstance(
  current: Fiber,
  workInProgress: Fiber,
  ctor: any,
  newProps: any,
  renderLanes: Lanes,
): boolean {
    // order code...

    const shouldUpdate = 
        checkHasForceUpdateAfterProcessing()
        || checkShouldComponentUpdate(
            workInProgress,
            ctor,
            oldProps,
            newProps,
            oldState,
            newState,
            nextContext,
        )
    // order code...

    return shouldUpdate;
}

function finishClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  shouldUpdate: boolean,
  hasContext: boolean,
  renderLanes: Lanes,
) {
    // order code...

    if (!shouldUpdate && !didCaptureError) {
        // 直接复用上次的已经存在的Fiber节点
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }

    const instance = workInProgress.stateNode;
    if (
        didCaptureError &&
        typeof Component.getDerivedStateFromError !== 'function'
    ) {
        // 如果有错误则进行组件的渲染
        nextChildren = null;
    } else {
        // 重新执行render方法获取React Element
        nextChildren = instance.render();
    }
    // order code...

    return nextChildren;
}
```
这段代码主要关注`updateClassInstance`方法中返回的`shouldUpdate`值，通过调用`checkHasForceUpdateAfterProcessing`方法或者`checkShouldComponentUpdate`会计算出是否需要进行组件的更新。  

其中`checkHasForceUpdateAfterProcessing`方法是判断当前组件是否使用了`this.forceUpdate`方法，如果使用强制更新了则返回*true*，没有使用强制更新则返回*false*并接着调用`checkShouldComponentUpdate`方法。  

`checkShouldComponentUpdate`方法就是判断当前组件是否存在`shouldComponentUpdate`这个生命周期函数，如果存在则调用这个生命周期函数，拿到`shouldComponentUpdate`的返回值作为`checkShouldComponentUpdate`方法的返回值，如果没有`shouldComponentUpdate`生命周期函数，则默认返回*true*（*true*表示需要进行组件渲染，*false*表示不需要进行组件渲染）。  

`updateClassInstance`方法的返回值`shouldUpdate`会作为第四个参数传递给`finishClassComponent`方法，而`shouldUpdate`就会作为本次是否执行类组件渲染的**判断条件**。  

如果`shouldUpdate`为*false*且没有捕获到错误就会调用`bailoutOnAlreadyFinishedWork`方法复用上次的`Fiber`节点作为返回值。如果`shouldUpdate`为*true*，则代表本次**需要更新**并执行组件的`render`方法完成组件渲染。

## 函数组件性能优化

通常组件层面的性能优化的目的是**避免组件进行不必要的渲染**，达到做到性能优化的目的。  

而函数组件自身的性能手段就比较单一，只有`useState`和`useReducer`返回的`dispatch`方法内部存在优化特性。  

函数组件还有另外一种优化方式，使用的场景是父子组件，在父组件用`useMemo`对子组件进行**缓存**，将子组件使用的参数作为`useMemo`的`deps（依赖项）`使用。这种使用方法就是将组件作为一个值使用，通过`useMemo`缓存起来，避免不必要的执行。且只有当组件的参数改变了，即依赖项的值改变了，`useMemo`才会重新执行回调函数即重新渲染子组件。

## 类组件性能优化

相比之下，类组件的性能优化有段就比较多了，比如上文提到的使用`shouldComponentUpdate`生命周期函数，这属于从`组件自身控制渲染`。另外还有一种通过组件自身控制组件渲染的方式，就是使用`React.PureComponent`类型。作用与`React.Component`是一样的，不过`PureComponent`有一项额外的特性，那就是对于*旧新props*和*旧新state*会进行**浅比较**，如果两组**浅比较**都相等，就不会触发执行类组件的渲染。  

如代码所示：
```js
function checkShouldComponentUpdate(
  workInProgress,
  ctor,
  oldProps,
  newProps,
  oldState,
  newState,
  nextContext,
) {
  const instance = workInProgress.stateNode;
  if (typeof instance.shouldComponentUpdate === 'function') {
    let shouldUpdate = instance.shouldComponentUpdate(
      newProps,
      newState,
      nextContext,
    );
    return shouldUpdate;
  }

  if (ctor.prototype && ctor.prototype.isPureReactComponent) {
    return (
      !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
    );
  }

  return true;
}
```
使用`PureComponent`的组件肯定是类组件，也就按照类组件更新时调用同样的方式。在代码中可以看到`PureComponent`处理优化逻辑的函数和`shouldComponentUpdate`生命周期函数的调用是同一个函数。且`shouldComponentUpdate`生命周期函数**优先级更高**，如果没有`shouldComponentUpdate`才会进行`PureComponent`的**浅比较**逻辑。最后会返回一个**是否需要更新的布尔值**决定是否调用`this.render`方法。

## React.memo

React官网对于`React.memo`方法的描述：
> React.memo是一个高阶组件。  

> 如果组件在相同 props 的情况下渲染相同的结果，那么你可以通过将其包装在 React.memo 中调用，以此通过记忆组件渲染结果的方式来提高组件的性能表现。  

> 默认情况下其只会对复杂对象做浅层对比,如果想要控制对比过程就传入自定义比较函数作为第二个参数。  

所以`React.memo`也可以作为函数组件和类组件通用的性能优化方法。那么在源码里面，对于使用`React.memo`包裹的组件又是如何处理的呢？  

如代码所示：
```js
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
    // order code...

    switch (workInProgress.tag) {
        case MemoComponent: {
            const type = workInProgress.type;
            const unresolvedProps = workInProgress.pendingProps;
            // Resolve outer props first, then resolve inner props.
            let resolvedProps = resolveDefaultProps(type, unresolvedProps);
            resolvedProps = resolveDefaultProps(type.type, resolvedProps);
            return updateMemoComponent(
                current,
                workInProgress,
                type,
                resolvedProps,
                renderLanes,
            );
        }
    }
    // order code...

}

function updateMemoComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  nextProps: any,
  renderLanes: Lanes,
): null | Fiber {
    // order cdoe...

    if (!hasScheduledUpdateOrContext) {
        // 获取旧props
        const prevProps = currentChild.memoizedProps;
        // 默认为浅比较
        let compare = Component.compare;
        // 比较函数
        compare = compare !== null ? compare : shallowEqual;
        // nextProps为新props
        if (compare(prevProps, nextProps) && current.ref === workInProgress.ref) {
        // 如果旧新props相等，并且前后ref属性相等
        // 调用bailoutOnAlreadyFinishedWork方法复用上一次的Fiber节点
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
        }
    }
    // order code...
}
```
在`beginWork`中对于不同的`workInProgress.tag`会进行不同组件逻辑的处理。  

像使用了`React.memo`包裹的组件对应的`React Element`属性的`$$typeof`会被赋值为`REACR_MEMO_ELEMENT`，也就是`workInProgres.tag`值为`MemoComponent`的组件就会调用`updateMemoComponent`方法创建对应的`Fiber节点`。在*if*语句中如果该组件没有被调度更新就会进入优化逻辑，判断是否有传入的`compare`函数。如果有就使用这个函数，如果没有就使用**浅比较**方法。最后*旧新props*相等并且该组件*前后的ref*属性没有变化，将复用前一次更新的`Fiber节点`作为本次`beginWork`方法的返回值。也就意味本次更新不会重新执行组件的渲染，达到了性能优化的目的。