## React中的性能优化

`React`源码内部有一个名词`bailout`，指当`useState`更新的`state`与当前`state`一致时（通过`Object.is`比较），`React`则不会重新`render`该组件的子组件，而会复用前一次更新已经生成的`Fiber`节点。  

**注意**：当命中`bailout`后，该组件可能还是会`render`，但是它的子组件并不会重新`render`。  

这是因为，大部分情况下，只有当前组件`render`时，`useState`才会执行，然后计算出新的`state`，进而与旧的`state`比较。这是针对子组件的性能优化手段。  

React的工作流程可以简单概括为：  
1. 交互触发的状态更新
2. 组件树进行render  

刚才说的`bailout`发生在步骤*2*：组件树开始`render`后，命中了`bailout`的逻辑后，子组件并不会进行`render`。  

实际上，还有一种更前置的优化策略：当步骤*1*触发时，发现`state`并没有发生变化，则直接退出，不会进行后续的工作流程。 

正常情况下，执行点击事件的同时触发更新，直到`render`组件，执行`useState`后计算出新的`state`，进而与旧的`state`比较，然后再判断是否命中`bailout`的逻辑。  

当执行点击事件时，可以立即计算出新的`state`，并与旧的`state`比较，如果两者相等的话，则不会进行组件树的`render`。  

这种将计算`state`的时机提前的策略称为`eagerState`（急切的`state`）。 

## 伴随的问题

通过交互触发的状态更新，如果状态前后的值没有变化，则可以省略剩下的步骤，这个优化策略被称为`eagerState`。

组件`render`时，如果子孙组件节点没有状态变化，则可以跳过子孙组件的重新`render`，这个优化策略被称为`bailout`。

从描述上来看，`eagerState`的逻辑是比较简单，只需要比较更新前后的`state`是否相等就可以了。  

但是实现上却很复杂。  

## eagerState的触发条件

什么叫“急切”的状态？只有在组件`render`的时候才能获取到组件的最新状态，即通过组件`render`并执行`useState`，然后计算出新的`state`。  

通常交互可能触发多个更新，这些多个更新将**共同**决定新状态的值。同时，这些更新都拥有各自的*优先级*，所以在`render`前并不能确定哪些更新会参与到状态的计算中。所以，这种情况必须执行组件的`render`，`useState`必须经过执行才能知道新状态的值。  

而`eagerState`的意义是在某种情况下，可以将这个计算的时机**提前**，在组件`render`之前就可以计算出最新的状态。  

这个情况是什么呢？当**组件上不存更新**时。  

当组件不存在更新的时候，即本次更新就是该组件的第一个更新。所以在只有一个更新的情况下是可以**提前**确定最新的`state`。  

所以`eagerState`的前提就是：当前组件不存在更新，那么首次触发更新的时候，就可以立即计算出最新`state`，然后与当前`state`比较。如果两者的值一致，则省略后续`render`的流程。  

例子：
```js
function App() {
  const [num, updateNum] = useState(0);
  console.log("App render", num);

  return (
    <div onClick={() => updateNum(1)}>
      <Child />
    </div>
  );
}

function Child() {
  console.log("child render");
  return <span>child</span>;
}
```
输出的结果：
```js
// 挂载时输出
App render 0
child render 

// 第一次点击输出
App render 1
child render

// 第二次点击输出
App render 1

// 第三次点击及之后，什么也不会打印

```
第二次点击时，理论上前后`state`的值并没有变化，所以不应该执行组件的`render`。但是结果竟然会执行组件的`render`。  

存在这种问题的原因是什么呢？  

`eagerState`的前提是：当前组件不存在更新。但是具体到源码来说，是组件对应的`current fiber`与`workInProgress fiber`都不存在更新。  

当第一次点击*div*时，打印：
```
App render1
child render
```
在`React`的工作流程中，会调用`markUpdateLaneFromFiberToRoot`方法为`current fiber`标记更新，即`fiber.lanes = 1`。  

然后在`beginWork`方法中，会先复用`current fiber`的一些属性（包括`lanes`）来创建`App FC`对应的`workInProgress fiber`，所以创建出来的`workInProgress fiber.lanes = 1`。

然后调用`renderWithHooks`方法执行组件的渲染。

在`renderWithHooks`方法中，会先清除`workInProgress fiber`的`lanes`标记，即`workInProgress.lanes = NoLanes`，然后再调用`updateReducer`计算新的`state`。  

完成渲染后会进行`fiber`树的切换，将构建好的`workInProgress fiber`与`current fiber`交换位置，即`workInProgress fiber`树变为`current fiber`树，`current fiber`树再变为`workInProgress fiber`树。

至此完成了一次状态更新，但是可以发现：在切换`fiber`树之前`current fiber`其实还存在更新标记（`lanes = 1`），因为在以上状态更新的过程中并没有清除`current fiber.lanes`的值。  

所以，尽管`React`最终进行了`fiber`树的替换，但是更新后的`curren fiber`与`workInProgress fiber`依然会通过`alternate`属性进行连接。  

<!-- 所以，虽然此次已经完成页面的渲染，但是`current fiber`的`alternate`指针依然指向它的前一个`fiber`节点（尽管这个`fiber`节点并没有任何用处）。   -->

以下是`eagerState`优化逻辑的代码：
```js
function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
    const alternate = fiber.alternate;
    // ...

    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
        //...

        if (is(eagerState, currentState)) {
            return;
        }
    }
}
```
从这段代码可以看到，进行`eagerState`逻辑判断的条件是`fiber.lanes === 0`，并且`alternate === null || alternate.lanes === 0`。而这个`fiber`指的是`workInProgress fiber`。

上面我们已经讲过了，在第一次点击触发的状态更新流程中，切换`fiber`树之前`current fiber`存在更新，`workInProgress fiber`不存在更新。  

在切换`fiber`树之后，`current fiber`不存在更新，而`workInProgress fiber`存在更新。  

然后在第二次点击调用`dispatchAction`方法时，这个`fiber`指的是当前的`workInProgress fiber`，它是存在存更新的。  

所以，在进入`eagerState`条件判断时，虽然满足`alternate.lanes === 0`，但是不满足`fiber.lanes === null`，因此没有命中`eagerState`的优化策略，从而又开启了一次状态更新。  

通过这次触发的状态更新流程，依然会通过`markUpdateLaneFromFiberToRoot`为`current fiber`和`workInProgress fiber`同时标记更新`lanes = 1`。

但与之前不同的是，这次更新中新旧`props`没有变化，所以会将更新标志位`didReceiveUpdate`置为*false*。

接着根据`workInProgress.tag`等于`FunctionComponent`而调用`updateFunctionComponent`方法。在`updateFunctionComponent`方法内部，会调用`renderWithHooks`方法执行组件的渲染，然后会进行如下的判断：
```js
if (current !== null && !didReceiveUpdate) {
  bailoutHooks(current, workInProgress, renderLanes);
  return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
}
```
因为本次属于`update`，所以`current`是存在的。并且`didReceiveUpdate`已经为`false`了，可以满足上述判断条件。

接着调用`bailoutHooks`方法：
```js
function bailoutHooks(
  current: Fiber,
  workInProgress: Fiber,
  lanes: Lanes,
) {
  // 复用current fiber的updateQueue属性
  workInProgress.updateQueue = current.updateQueue;
  // 赋值effect
  workInProgress.flags &= ~(PassiveEffect | UpdateEffect);
  // 移除current fiber.lanes属性中包含的lanes值
  // removeLanes = current.lanes & ~lanes
  current.lanes = removeLanes(current.lanes, lanes);
}
```
可以看到在调用了`bailoutHooks`方法后，会清除掉`current fiber.lanes`属性上包含的`lanes`值。因为当前`current fiber.lanes = 1`，在执行`removeLanes`方法后，`current fiber.lanes = 0`。

在执行完`bailoutHooks`方法后，会调用`bailoutOnAlreadyFinishedWork`方法复用`current fiber`来创建`workInProgress fiber`。  

最后，`commit`阶段会切换`fiber`树，`current fiber`树变为`workInProgress fiber`树，`workInProgress fiber`树变为`current fiber`树。  

再到第三次点击调用`dispatchAction`方法时，`fiber`对应的`workInProgress fiber`不存在更新。`alternate`对应的`current fiber`也不存在更新，所以此次执行会命中`eagerState`的优化策略，不会开启状态更新，从而达到性能优化的目的。

<!-- 但是，重点在`alternate.lanes`是存在更新标记的，即`alternate.lanes !== 0`。所以第二次点击事件触发的状态更新，尽管新旧`state`的值没有变化，但依然会进行组件的`render`，不会命中到`eagerState`的优化逻辑。  

在之后的点击，触发的更新都会命中`eagerState`的优化，因为`workInProgress fiber`与`alternate`上都不存在标记的更新了。  

其中的关键在于，在经过挂载到第一次点击的过程中，调用`markUpdateLaneFromFiberToRoot`方法，标记`current fiber`为更新，即`current fiber.lanes = 1`。然后在创建`workInProgress fiber`的过程中，会复用`curernt fiber`的一些属性，其中就包括`lanes`，所以创建的`workInProgress fiber.lanes = 1`。  

当进入到组件渲染，执行`renderWithHooks`时，会将`workInProgress fiber.lanes = 0`。  

然后到commit阶段会切换`current`指针，将`workInProgress fiber`树变为`current fiber`树。

现在，虽然原先的`current fiber`树已经从页面上消失了，但是与当前`current fiber`树的连接并没有消失，依然可以通过`alternate`指针进行访问。

所以，在第三次点击触发更新时，调用`dispatchAction`方法进入`eagerState`的判断时，使用`alternate`指针访问的原先`current fiber`依然存在**更新标记**，所以此次更新并不会命中`eagerState`的优化逻辑。 -->



## 总结

综上所述，`React`性能优化并没有做到极致，因为存在两个相关联的`fiber`节点，并且也没有对`current fiber`上的更新标记及时的进行清除，导致在`fiber`树的切换后`workInProgress fiber`上总是存在更新标记。

由此可见，`eagerState`的优化策略并没有达到*最*理想的状态。