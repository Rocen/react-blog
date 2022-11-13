## Renderer（渲染器）

`commit`阶段的主要工作（即R`enderer`的工作流程）分为三部分：
+ `before mutation`阶段（执行DOM操作前）
+ `mutation`阶段（执行DOM操作）
+ `layout`阶段（执行DOM操作后）  

在`before mutation`阶段之前和`layout`阶段之后还有一些额外的工作，比如涉及到`useEffect`的调度和触发，优先级相关的重置，`ref`的绑定和解绑。  

`commit`阶段的三个子阶段都会从`rootFiber`循环向下遍历子`Fiber`节点，然后为遍历到的子节点执行对应阶段的方法。

## before mutation阶段

`before mutation`阶段的主函数是`commitBeforeMutationEffects`。代码如下：
```js
function commitBeforeMutationEffectsOnFiber(finishedWork: Fiber) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;

  if (enableCreateEventHandleAPI) {
    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
        // ...focus blur相关
    }
  }

  if ((flags & Snapshot) !== NoFlags) {
    switch (finishedWork.tag) {
        // 类组件
        case ClassComponent: {
            if (current !== null) {
              const prevProps = current.memoizedProps;
              const prevState = current.memoizedState;
              const instance = finishedWork.stateNode;
              // 调用getSnapshotBeforeUpdate生命周期函数
              const snapshot = instance.getSnapshotBeforeUpdate(
                  finishedWork.elementType === finishedWork.type
                  ? prevProps
                  : resolveDefaultProps(finishedWork.type, prevProps),
                  prevState,
              );
              instance.__reactInternalSnapshotBeforeUpdate = snapshot;
            }
            break;
        }
  }
}
```
`commitBeforeMutationEffects`函数主要做了两个工作：
+ 处理DOM阶段渲染/删除后的`autofocus、blur`逻辑
+ 调用`getSnapShotBeforeUpdate`生命周期函数  

从`Reactv16`开始，一些`componentWillXXX`钩子前增加了`UNSAFE_`前缀。因为这些生命周期函数可能存在多次触发的问题，所以`React`提供了替代的生命周期函数`getSnapShotBeforeUpdate`。  

从代码中可以看到，`getSnapShotBeforeUpdate`是在`commit`阶段的`before mutation`阶段调用的，而由于`commit`阶段是同步执行的，所以不会遇到多次调用`getSnapShotBeforeUpdate`的问题。

## mutation阶段

`mutation`阶段的主函数是`commitMutationEffects`。代码如下：
```js
function commitMutationEffectsOnFiber(finishedWork: Fiber, root: FiberRoot) {
  // 获取flags
  const flags = finishedWork.flags;
  // 根据ContentReset effectTag重置文本节点
  if (flags & ContentReset) {
    commitResetTextContent(finishedWork);
  }
  // 更新ref
  if (flags & Ref) {
    const current = finishedWork.alternate;
    if (current !== null) {
      commitDetachRef(current);
    }
    }
  }

  // 根据effectTag分别处理
  // 插入或更新
  const primaryFlags = flags & (Placement | Update | Hydrating);
  switch (primaryFlags) {
    // 处理插入DOM
    case Placement: {
      commitPlacement(finishedWork);
      finishedWork.flags &= ~Placement;
      break;
    }
    // 处理插入和更新DOM
    case PlacementAndUpdate: {
      // 
      commitPlacement(finishedWork);
      finishedWork.flags &= ~Placement;

      // Update
      const current = finishedWork.alternate;
      commitWork(current, finishedWork);
      break;
    }
    // 处理更新DOM
    case Update: {
      const current = finishedWork.alternate;
      commitWork(current, finishedWork);
      break;
    }
  }
}
```
`commitMutationEffects`函数主要做了三个工作：
+ 根据`ContentReset effectTag`重置文本节点
+ 更新`ref`
+ 根据`effectTag`分别做不同的处理（`Placement` | `Update`）  

其中还包括`Hydrating`作为服务端渲染相关，就不需要关注了。

### Placement
当`Fiber.flags`包含`Placement effectTag`，则意味着该`Fiber`节点对应的`DOM`节点需要插入到页面中。  
调用的方法为`commitPlacement`，具体代码：
```js
function commitPlacement(finishedWork: Fiber): void {
  if (!supportsMutation) {
    return;
  }

  // 获取当前Fibe节点的父级Fiber节点
  const parentFiber = getHostParentFiber(finishedWork);

  // 寻找父级Fiber节点对应的DOM节点
  let parent;
  let isContainer;
  const parentStateNode = parentFiber.stateNode;
  switch (parentFiber.tag) {
    // 原生类型，如div，span
    case HostComponent:
      // fiber.stateNode就是Fiber节点对应的DOM节点
      parent = parentStateNode;
      isContainer = false;
      break;
    // rootFiber节点
    case HostRoot:
      // 因为rootFiber节点的stateNode属性指向FiberRootNode
      // 所以rootFiber节点的真实DOM节点就保存在FiberRootNode的containerInfo属性上
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    default:
  }
  // 当该节点包含ContentReset effectTag，则重置该文本节点
  if (parentFiber.flags & ContentReset) {
    resetTextContent(parent);
    parentFiber.flags &= ~ContentReset;
  }
  // 获取当前Fiber节点的兄弟节点
  const before = getHostSibling(finishedWork);
  // 判断当前Fiber节点是否是rootFiber
  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}

// insertOrAppendPlacementNode和insertOrAppendPlacementNodeIntoContainer的代码几乎一致
function insertOrAppendPlacementNode(
  node: Fiber,
  before: ?Instance,
  parent: Instance,
): void {
  const {tag} = node;
  // 只有原生类型的节点才存在真实DOM节点
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    const stateNode = node.stateNode;
    // 判断是否存在兄弟Fiber节点
    if (before) {
      // 存在兄弟Fiber节点，需要调用兄弟DOM节点的insetBefore方法执行插入操作
      insertBefore(parent, stateNode, before);
    } else {
      // 如果不存在兄弟Fiber节点，则调用父级DOM节点的appendChild方法执行插入操作
      appendChild(parent, stateNode);
    }
  } else if (tag === HostPortal) {
    // ...
  } else {
    const child = node.child;
    // 遍历子孙Fiber节点执行插入操作
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}
```
从这段代码可以看出，`commitPlacement`方法关键的一步在于需要通过当前`Fiber`节点是否存在兄弟`Fiber`节点来决定当前`Fiber`节点对应`DOM`节点的插入方式。  

看到这里可能会有疑问，为什么不默认使用`appendChild`方法来实现插入操作，还要分情况使用`insertBefore`方法呢？  
原因在于`React Diff`算法对于更新前后移动的`Fiber`节点的处理。比如：
```js
// 更新前
abcdef

// 更新后
abecdf
```
同级存在以上5个`Fiber`节点，字母代表每个`Fiber`节点的`key`和`DOM`节点的文本值。  

可以看到在更新前后*c*节点和*d*节点进行了位置的移动，都移到了*e*节点的后面，*f*节点的前面。那么通过`diff`算法，会将*c*节点和*d*节点标记移动，这个标记指为`Fiber`节点标记`Placement effectTag`，就说明需要对*c*节点和*d*节点执行插入操作。如果只存在`appendChild`方法，通过*c*节点和*d*节点寻找到它们的父级节点，然后调用父级节点的`appendChild`方法，完成插入操作的顺序就变成了*abefcd*，显然结果是不正确的，混乱了节点移动后的顺序。  

相反，如果使用`insertBefore`方法就可以在大多数情况下避免顺序的错误。使用`insertBefore`方法需要寻找当前`Fiber`节点的下一个兄弟`Fiber`节点，*c*节点的兄弟节点是*d*，d节点的兄弟节点是*f*。那么通过`insertBefore`方法，*c*节点插入到*d*节点的前面，再将*d*节点插入到*f*节点的前面，最终节点的顺序就是正确的了。  

具体`diff`算法的介绍可以看[这篇](../implement/diff.md)文章。

### Update
当`Fiber`节点含有`Update effectTag`，意味着该`Fiber`节点需要更新。调用的方法是`commitWork`，它会根据`Fiber.tag`分别处理。
```js
// 简化后
function commitWork(current: Fiber | null, finishedWork: Fiber): void {
  // 根基Fiber节点的类型
  switch (finishedWork.tag) {
    // 函数组件
    case FunctionComponent: {
        // 执行useLayoutEffect的销毁函数
        commitHookEffectListUnmount(
          HookLayout | HookHasEffect,
          finishedWork,
          finishedWork.return,
        );
      return;
    }
    // 类组件
    case ClassComponent: {
      return;
    }
    // 原生节点
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      // 当前Fiber节点存在真实DOM节点
      if (instance != null) {
        const newProps = finishedWork.memoizedProps;
        const oldProps = current !== null ? current.memoizedProps : newProps;
        const type = finishedWork.type;
        // 当updatePayload存在，则说明有需要更新的属性
        const updatePayload: null | UpdatePayload = (finishedWork.updateQueue: any);
        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          // 调用commitUpdate方法进行DOM节点属性的更新
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork,
          );
        }
      }
      return;
    }
    // 文本节点
    case HostText: {
      const textInstance: TextInstance = finishedWork.stateNode;
      const newText: string = finishedWork.memoizedProps;
      const oldText: string =
        current !== null ? current.memoizedProps : newText;
      // 更新文本内容
      commitTextUpdate(textInstance, oldText, newText);
      return;
    }
  }
}
```
从这段代码可以看到，当前`Fiber`节点为`FunctionComponent`时会同步调用`useLayoutEffect`的销毁函数，入口函数就是`commitHookEffectListUnmount`。该方法会遍历当前`Fiber`节点的`updateQueue`，从第一个`effect`循环依次执行对应的`destory`销毁函数。具体的介绍可以看[这篇](../hooks/executeUseEffect.md#执行useeffect)文章。  

当前`Fiber`节点为`HostComponent`时会进入`commitUpdate`函数，最终调用`updateDOMProperties`方法，将`render`阶段 `completeWork`中为`Fiber`节点赋值的`updateQueue`对应的内容渲染到页面上。
```js
function updateDOMProperties(
  domElement: Element,
  updatePayload: Array<any>,
  wasCustomComponentTag: boolean,
  isCustomComponentTag: boolean,
): void {
  // 循环updatePayload，updatePayload就是updateQueue
  for (let i = 0; i < updatePayload.length; i += 2) {
    // updatePayload是一个数组，偶数项是属性名，奇数项是属性值
    // 属性名
    const propKey = updatePayload[i];
    // 属性值
    const propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      // 属性名为style，处理style的值
      // 主要工作 首先获取到DOM节点的styles属性，然后for in循环遍历propValue对象，通过 style[styleName] = styleValue 完成属性的设置
      setValueForStyles(domElement, propValue);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      // 属性名为dangerously_set_inner_html，处理__html的值
      // 主要工作 node.innerHTHML = propValue
      setInnerHTML(domElement, propValue);
    } else if (propKey === CHILDREN) {
      // 属性名为childrene，处理文本内容
      // 主要工作 首先判断是否是单一的文本节点，如果是单一的文本节点，则通过node.nodeValue = text，否则node.textContent = text
      setTextContent(domElement, propValue);
    } else {
      // 其他属性
      // 会调用setAttribute方法进行预设属性的设置
      setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
    }
  }
}
```
### Deletion
在稍早一些版本中，也会通过`commitMutationEffectsOnFiber`方法对于`Fiber`节点的e`ffectTag`进行判断，是否包含`Deletion effectTag`，如果包含的话表示需要将该`Fiber`节点对应的`DOM`节点从页面中删除，调用的方法为`commitDeletion`。  

但是在17版本中，对于删除节点的逻辑做了调整。通过`diff`算法计算得出需要删除的节点会调用`deleteChild`或`deleteRemainningChild`方法，将需要删除的`Fiber`节点保存在该父级`Fiber`节点的`deletions`属性中，这个属性的数据结构是一个数组。并同时为该父级`Fiber`节点执行按位或 `returnFiber.flags |= ChildDeletion` ，表示该`Fiber`节点存在需要删除的子`Fiber`节点。  

具体执行删除的操作是在`commitMutationEffectsOnFiber`函数的上层函数`commitMutationEffects_begin`中进行。具体代码如下：
```js
function commitMutationEffects_begin(root: FiberRoot) {
  while (nextEffect !== null) {
    const fiber = nextEffect;

    const deletions = fiber.deletions;
    if (deletions !== null) {
      // 遍历deletions数组，取到需要删除的Fiber节点，然后调用commitDeletion方法
      for (let i = 0; i < deletions.length; i++) {
        const childToDelete = deletions[i];
        try {
          commitDeletion(root, childToDelete, fiber);
        } catch (error) {
          reportUncaughtErrorInDEV(error);
          captureCommitPhaseError(childToDelete, fiber, error);
        }
      }
    }
    // .order code...
  }
}
```
`commitDeletion`方法会执行如下操作：
+ 递归遍历`Fiber`节点及其子孙`Fiber`节点，调用父级`DOM`节点的`removeChild`方法执行删除子DOM节点的操作
+ 当`fiber.tag`为`ClassComponent`时，会调用存在的`componentWillUnmount`生命周期函数
+ 解绑`ref`，就是将`ref`对象或函数置为`null`
+ 执行存在的`useLayoutEffect`的销毁函数  

## layout阶段

`layout`阶段主函数是`commitLayoutEffects`，具体代码如下：
```js
// 简化后
function commitLayoutEffectOnFiber(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
  if ((finishedWork.flags & LayoutMask) !== NoFlags) {
    switch (finishedWork.tag) {
      // 函数组件
      case FunctionComponent:{
        // 执行useLayoutEffect的回调函数
        commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
        break;
      }
      // 类组件
      case ClassComponent: {
        const instance = finishedWork.stateNode;
        if (finishedWork.flags & Update) {
          if (!offscreenSubtreeWasHidden) {
            if (current === null) {
                // current为null时，说明此次是首屏渲染，即mount，调用componentDidMount生命周期函数
                instance.componentDidMount();
            } else {
              const prevProps =
                finishedWork.elementType === finishedWork.type
                  ? current.memoizedProps
                  : resolveDefaultProps(
                      finishedWork.type,
                      current.memoizedProps,
                    );
              const prevState = current.memoizedState;
              // current不为null，说明此次不是首屏渲染，即update，调用componentDidUpdate生命周期函数
              instance.componentDidUpdate(
                prevProps,
                prevState,
                instance.__reactInternalSnapshotBeforeUpdate,
              );
            }
          }
        }
        const updateQueue: UpdateQueue<
          *,
        > | null = (finishedWork.updateQueue: any);
        // 如果存在updateQueue，说明存在副作用
        // 遍历updateQueue.effects，执行effect.callback函数
        // 通常指this.setState的第二个参数回调函数
        if (updateQueue !== null) {
          commitUpdateQueue(finishedWork, updateQueue, instance);
        }
        break;
      }
      case HostRoot: {
        const updateQueue: UpdateQueue<
          *,
        > | null = (finishedWork.updateQueue: any);
        if (updateQueue !== null) {
          let instance = null;
          if (finishedWork.child !== null) {
            switch (finishedWork.child.tag) {
              case HostComponent:
                instance = getPublicInstance(finishedWork.child.stateNode);
                break;
              case ClassComponent:
                instance = finishedWork.child.stateNode;
                break;
            }
          }
          // 与类组件执行副作用的情况一样
          // 遍历updateQueue.effects，执行effect.callback函数
          // 通常指this.setState的第二个参数回到函数，ReactDOM.render的第三个参数回调函数
          commitUpdateQueue(finishedWork, updateQueue, instance);
        }
        break;
      }
      case HostComponent: {
        const instance: Instance = finishedWork.stateNode;
        if (current === null && finishedWork.flags & Update) {
          const type = finishedWork.type;
          const props = finishedWork.memoizedProps;
          // 用来处理输入框等渲染后的autofocus
          commitMount(instance, type, props, finishedWork);
        }
        break;
      }
    }
  }

  if (finishedWork.flags & Ref) {
    // 赋值ref
    // 主要工作就是获取到该Fiber节点对应的真实DOM节点
    // ref如果是对象类型，则赋值给current属性，如果是函数类型，则作为参数传递
    commitAttachRef(finishedWork);
  }
}
```
`commitLayoutEffects`函数主要做了三个工作：
+ 根据`fiber.tag`分别处理，当`FunctionComponent`时，调用`useLayoutEffect`的回调函数，当`ClassComponent`时，判断`current`是否为`null`，`mount`时调用`componentDidMount`，`update`时调用`componentDidUpdate`
+ 执行回调函数，当`ClassComponent`时，执行`this.setState`的第二个参数，当`HostRoot`时，执行`ReactDOM.render`的第三个参数。
+ 赋值`ref`

## current Fiber树切换

从上文可以看到，`Renderer`阶段的主要工作就是针对`Fiber`节点对应`的DOM`节点的执行具体的操作。  

但在`commitRootImpl`函数内执行完`commitLayoutEffects`方法之后，还有两个非常关键的步骤：
+ 调度`useEffect`
+ 切换`currentFiber`树  

因为调度`useEffect`的内容比较多，同时逻辑比较复杂，会在[这篇](../hooks/executeUseEffect.md#调度useeffect)文章详细介绍。  

切换`currenFiber`树的代码如下：
```js
root.current = finishedWork;
```
其实就一行代码。在双缓存机制一节介绍过`workInProgress Fiber`树在`commit`阶段完成渲染后会变为`current Fiber`树。这行代码的作用就是切换`fiberRootNode`指向的`current Fiber`树。

那么这行代码为什么在这里呢？（在`mutation`阶段结束后，`layout`阶段开始前。）  

我们知道`componentWillUnmount`会在`mutation`阶段执行。此时`current Fiber`树还指向前一次更新的`Fiber`树，在生命周期钩子内获取的DOM还是更新前的。  

而`componentDidMount`或`componentDidUpdate`会在`layout`阶段执行。此时`current Fiber`树已经指向更新后的`Fiber`树，在生命周期钩子内获取的DOM就是更新后的。  

所以，在此时进行`current Fiber`树的切换比较合适。

## 总结

`commit`阶段的主要工作（即`Renderer`的工作流程）分为三部分：
+ `before mutation`阶段（执行DOM操作前）
+ `mutation`阶段（执行DOM操作）
+ `layout`阶段（执行DOM操作后） 

`before mutation`阶段主要做了两个工作：
+ 处理DOM阶段渲染/删除后`的autofocus、blur`逻辑
+ 对于`ClassComponent`，调用`getSnapShotBeforeUpdate`生命周期函数  

`mutation`阶段主要做了三个工作：
+ 根据`ContentReset effectTag`重置文本节点
+ 更新`ref`
+ 根据`effectTag`分别做不同的处理，包括：执行`DOM`节点的插入，更新`DOM`节点的属性，删除`DOM`节点

`layout`阶段主要做了三个工作：
+ 根据`fiber.tag`分别做不同的处理，对于`FunctionComponent`，调用`useLayoutEffect`的回调函数，对于`ClassComponent`，判断`current`是否为`null`，`mount`时调用`componentDidMount`，`update`时调用`componentDidUpdate`
+ 执行回调函数，对于`ClassComponent`，执行`this.setState`的第二个参数回调函数，对于`HostRoot`，执行`ReactDOM.render`的第三个参数回调函数
+ 赋值`ref`  

在`before mutation`阶段之前会调度`useEffect`，`layout`阶段之后还涉及`useEffect`的触发和`currentFiber`树的切换等工作。
