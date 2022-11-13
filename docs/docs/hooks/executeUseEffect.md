## useEffect的执行
---
React文档对与effect的执行时机描述：
> 与 componentDidMount、componentDidUpdate 不同的是，在浏览器完成布局与绘制之后，传给 useEffect 的函数会延迟调用。
> 这使得它适用于许多常见的副作用场景，比如设置订阅和事件处理等情况，因此不应在函数中执行阻塞浏览器更新屏幕的操作。  

可见，`useEffect`异步执行的原因主要是**防止同步执行时阻塞浏览器渲染**。  

因为`useEffect`的触发是**异步执行**的，涉及到的工作流程比较多和分散，所以需要单独成一篇文章介绍。  

## 调度useEffect
---
调度`useEffect`的时机是在`renderer`阶段的`before mutation`阶段之前，如代码所示：
```js
function commitRootImpl(root, renderPriorityLevel) {
    // 调度
    if (
        (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
        (finishedWork.flags & PassiveMask) !== NoFlags
    ) {
        if (!rootDoesHavePassiveEffects) {
            rootDoesHavePassiveEffects = true;
            scheduleCallback(NormalSchedulerPriority, () => {
                flushPassiveEffects();
                return null;
            });
        }
    }

    // before mutation...
}
```
从这段代码可以看到，在使用`scheduleCallback`方法取调度`flushPassiveEffects`函数之前，会先使用`PassiveMask`标识去判断当前`Fiber`节点或当前`Fiber`节点的子孙`Fiber`树是否存在`useEffect`，如果存在的话，才会进行`useEffect`的调度工作。  

## 如何异步调度
---
执行`useEffect`的入口函数是`flushPassiveEffects`，具体代码如下：
```js
function flushPassiveEffects(): boolean {
  // rootWithPendingPassiveEffects不为null时会进入到正式执行阶段
  if (rootWithPendingPassiveEffects !== null) {
    // 获取比当前lanes中优先级最高的lane较低的事件优先级
    const renderPriority = lanesToEventPriority(pendingPassiveEffectsLanes);
    // 将DefaultEventPriority与渲染优先级进行比较，获取两者更低的优先级，作为useEffect执行的优先级
    // 通常都是DefaultEventPriority对应的DefaultLane更低
    // 所以useEffect执行时的事件优先级是DefaultLane
    const priority = lowerEventPriority(DefaultEventPriority, renderPriority);
    // 获取当前优先级
    const previousPriority = getCurrentUpdatePriority();
    try {
      ReactCurrentBatchConfig.transition = 0;
      // 设置useEffect执行的优先级
      setCurrentUpdatePriority(priority);
      // 调用主函数
      return flushPassiveEffectsImpl();
    } finally {
      // 返还之前的优先级
      setCurrentUpdatePriority(previousPriority);
    }
  }
  return false;
}
// 简化后
function flushPassiveEffectsImpl() {
    // 从全局变量rootWithPendingPassiveEffects获取rootFiber
    if (rootWithPendingPassiveEffects === null) {
        return false;
    }
    // 赋值root变量
    const root = rootWithPendingPassiveEffects;
    // 重置变量
    rootWithPendingPassiveEffects = null;

    // 执行useEffect的销毁函数
    commitPassiveUnmountEffects(root.current);
    // 执行useEffect的回调函数
    commitPassiveMountEffects(root, root.current);

    flushSyncCallbacks();

    return true;
}
```
从这段代码可以看到，`rootWithPendingPassiveEffects`的初始值是`null`，那么什么时候才会对`rootWithPendingPassiveEffects`赋值呢？
```js
// 初始值
let rootDoesHavePassiveEffects = false;
let rootWithPendingPassiveEffects = null;

function commitRootImpl(root, renderPriorityLevel) {

    // layout...


    // 赋值
    const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

    if (rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = false;
        // 赋值rootWithPendingPassiveEffects为rootFiber
        rootWithPendingPassiveEffects = root;
        pendingPassiveEffectsLanes = lanes;
    }
}
```
从这段代码可以看到，在`layout`阶段之后会根据`rootDoesHavePassiveEffects`是否为`true`决定是否赋值`rootWithPendingPassiveEffects`，而在调度`useEffect`时已经将`rootDoesHavePassiveEffects`赋值为`true`了。所以执行到这里时，一定会进入if语句内部进行`rootWithPendingPassiveEffects`的赋值操作。  

然后当通过调度执行`flushPassiveEffects`方法时就会正式进入到执行`useEffect`的工作。

## 执行useEffect
---
执行`useEffect`的阶段需要根据`commitHookEffectListUnmount`和`commitHookEffectListMount`分别完成*销毁函数*和*回调函数*的执行工作，具体代码如下：
```js
function commitHookEffectListUnmount(
  flags: HookFlags,
  finishedWork: Fiber,
  nearestMountedAncestor: Fiber | null,
) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  // lastEffect是最后一个effect
  if (lastEffect !== null) {
    // 取到第一个effect
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    // 通过移动next指针遍历effectList链表
    do {
      // 判断为对应的effect类型
      if ((effect.tag & flags) === flags) {
        // 取到销毁函数
        const destroy = effect.destroy;
        // 重置变量
        effect.destroy = undefined;
        if (destroy !== undefined) {
             try {
                destroy();
            } catch (error) {
                // 捕获commit阶段抛出的错误
            }
        }
      }
      // 移动next指针
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

function commitHookEffectListMount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  // lastEffect是最后一个effect
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    // 取到第一个effect
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    // 通过移动next指针遍历effectList链表
    do {
      // 判断为对应的effect类型
      if ((effect.tag & tag) === tag) {
        // 取到回调函数
        const create = effect.create;
        // 执行回调函数
        // 同时将回调函数的执行结果赋值为销毁函数的值
        effect.destroy = create();
      }
      // 移动next指针
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```
从这段代码可以看到`useEffect`的*销毁函数*和*回调函数*的执行代码几乎一致，而且代码逻辑比较清晰易懂。  

## 总结
---
整个`useEffect`的异步调用分为三步：
+ 在`before mutation`阶段之前使用`scheduleCallback`函数调度`flushPassiveEffects`方法
+ `layout`阶段之后，将`root`赋值给`rootWithPendingPassiveEffects`变量
+ 通过`scheduleCallback`触发`flushPassiveEffects`方法，在`flushPassiveEffects`内部从`root`向下遍历`Fiber`树，为遍历到存在`useEffect`的`Fiber`节点执行*销毁函数*和*回调函数* 

`useEffect`异步执行的主要原因是防止**同步执行时阻塞浏览器的渲染**。  

与此相对的，`useLayoutEffect`是在`layout`阶段**同步执行**的，所以存在**阻塞浏览器渲染**的风险，应该谨慎使用。  

## Plus
---
还有要说明的一点是，`useEffect`和`useLayoutEffect`都是通过`commitHookEffectListUnmount`和`commitHookEffectListMount`这两个方法执行各自的*销毁函数*和*回调函数*的。 

既然这两个`hook`调用的都是同一个方法，又是怎么区分当前执行到的`hook`是`useEffect`还是`useLayoutEffect`呢？  

在`commitHookEffectListUnmount`和`commitHookEffectListMount`方法内都会有这一段代码：
```js
if ((effect.tag & flags) === flags)
```
其中`flags`变量是当前函数的第一个参数，所以只要根据不同的场景传递不同的参数值，就可以区分出究竟是`useEffect`还是`useLayoutEffect`了。  

在`mount hook`或`update hook`时，会将`HookLayout | HookHasEffect`和`HookPassive | HookHasEffect`分别作为`useEffect`和`useLayoutEffect`的标志，保存在`effect.tag`中。  

当需要执行`useLayoutEffec`时，`HookLayout | HookHasEffect`会作为`flags`的值。当需要执行`useEffect`时，`HookPassive | HookHasEffect`会作为`flags`的值。  

这样通过按位或操作，就可以判断当前`effect`是属于`useEffec`还是`useLayoutEffect`了。
```js
// 定义
export const HasEffect = /* */ 0b001;
export const Layout = /*    */ 0b010;
export const Passive = /*   */ 0b100;

// 导入
import {
  HasEffect as HookHasEffect,
  Layout as HookLayout,
  Passive as HookPassive,
} from './ReactHookEffectTags';
```
所以源码内部在用到`useEffect`或`useLayoutEffect`时，会根据`HookPassive`和`HookLayout`这两个*标志位*来进行识别。