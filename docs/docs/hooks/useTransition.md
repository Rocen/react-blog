## useTransition

`React`官网对于`Transition`的描述：
> Transitions 是 React 18 引入的一个全新的并发特性。它允许你将标记更新作为一个 transitions，这会告诉 React 它们可以被中断执行，并避免回到已经可见内容的 Suspense 降级方案。

从源码的角度来看这句话的关键在于**“可以被中断执行”**，那么说明使用`useTransition`触发的更新对应的优先级是相对较低的，因为它可以被中断。那么我猜测，最适合它的优先级应该是`DefaultLane`。  

`useTransition`的使用方法：
> const [isPending, startTransition] = useTransition();

返回一个状态值表示过渡任务的等待状态，以及一个启动该过渡任务的函数。  

从使用方法上看，它的返回值对应的数据类型和`useState`是及其相似。`isPending`是一个变量，`startTransition`是一个启动过渡任务的函数。所以可以推测出，在实现上这两个`hook`一定是有所关联的。  

## 用途

我们知道，新版本`React`最大的特点就是并发特性。并发特性是指，页面中在同一时刻可以同时存在多种更新，并且根据各自的优先级高低按照顺序依次执行，在更新执行的过程中也不会阻塞浏览器的渲染。  

所以，只要在页面中所有非紧急的更新都可以使用`useTransition`。  

举例来说：在网上商城的购物车页面，一般会有最常用的三个属性：商品单价、商品数量和所选商品总金额。  

当我们通过点击-、+按钮来改变某个商品的数量，产生变化的地方有两个：商品数量和总金额。那么我们就需要在点击事件里面通过`useState`方法去改变商品数量和总金额这个两个变量。  

但是，如果我们仔细思考的话，其实可以把这两个变量的更新做出优先级的区分。当用户点击的时候，一定是希望立刻得到反馈，这个反馈体现在页面上就是商品数量马上改变。那么改变商品的数量这个更新就应该立即执行，所以它的优先级一定是最高的。  

相对的，改变总金额的更新对应的优先级就是相对较低的，因为总金额涉及到商品金额和数量的计算过程，可能还包括优惠打折、满减等复杂情况。所以页面上总金额的变化是可以延迟一段时间，等到商品数量已经渲染完成之后再进行总金额的渲染。  

例子：
```js
function App() {
    const [num, setNum] = useState(0);
    const [count, setCount] = useState(0);
    const [isPending, startTransition] = useTransition();
    
    function handleClick() {
        setNum(n => n + 1);
        startTransition(() => {
            setCount(c => c + 10)
        })
    }
  
    return (
      <div>
          <button onClick={handleClick}>数量 + 1</button>
          价格：10元
          数量：{num}
          合计：{isPending ? '计算中...' : count}
      </div>
    );
}
```
通过点击事件会触发两个更新，`setNum`改变商品数量，`setCount`改变总金额。区别是`setNum`会立即触发，而`setCount`被包裹在`startTransition`的回调函数中，会等到`setCount`执行结束后再执行。
## useTransition的实现

`mount`和`update`，`useTranstion`方法在源码中分别对应的`mountTransition`和`updateTransition`。
```js
function mountTransition(): [boolean, (() => void) => void] {
  const [isPending, setPending] = mountState(false);
  // The `start` method never changes.
  const start = startTransition.bind(null, setPending);
  const hook = mountWorkInProgressHook();
  hook.memoizedState = start;
  return [isPending, start];
}

function updateTransition(): [boolean, (() => void) => void] {
  const [isPending] = updateState(false);
  const hook = updateWorkInProgressHook();
  const start = hook.memoizedState;
  return [isPending, start];
}
```
从这段代码可以看到，主要的工作都是在`mountTransition`中进行的，`updateTransition`只负责取数据而已。并且可以明显的看到，`isPending`这个变量是使用`useState`返回的，所以也印证之前对于两者存在关联的猜测。  

再看下启动该过渡任务的函数`startTransition`：
```js
function startTransition(setPending, callback) {
  // 获取当前更新的优先级
  const previousPriority = getCurrentUpdatePriority();
  // 设置优先级，优先级的值取决于previousPriority和ContinuousEventPriority两者之间优先级更高的
  setCurrentUpdatePriority(
    higherEventPriority(previousPriority, ContinuousEventPriority),
  );
  // 触发改变isPending的状态更新，对应的优先级是不低于ContinuousEventPriority
  setPending(true);
  // 设置transition标识，表示触发了transition
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = 1;
  try {
    // 触发改变isPending的状态更新
    setPending(false);
    // 执行回调函数
    callback();
  } finally {
    // 重置优先级
    setCurrentUpdatePriority(previousPriority);
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}
```
从这段代码可以看到，在`startTransition`至少可能触发三个状态更新，分别为：s`etPending(true)`、`setPending(false)`和`callback()`。因为`setPending`方法是通过`mountState`暴露出来的，所以使用`setPending`就会触发一次状态更新。而`callback`是使用`startTransition`传入的回调函数，在回调函数内部使用了`setCount`，所以也会触发一次状态更新。  

获取`transition`相关的优先级的代码：
```js
const NoTransition = 0;

const TransitionLanes: Lanes = /*                       */ 0b0000000001111111111111111000000;
const TransitionLane1: Lane = /*                        */ 0b0000000000000000000000001000000;
const TransitionLane2: Lane = /*                        */ 0b0000000000000000000000010000000;
const TransitionLane3: Lane = /*                        */ 0b0000000000000000000000100000000;
const TransitionLane4: Lane = /*                        */ 0b0000000000000000000001000000000;
const TransitionLane5: Lane = /*                        */ 0b0000000000000000000010000000000;
const TransitionLane6: Lane = /*                        */ 0b0000000000000000000100000000000;
const TransitionLane7: Lane = /*                        */ 0b0000000000000000001000000000000;
const TransitionLane8: Lane = /*                        */ 0b0000000000000000010000000000000;
const TransitionLane9: Lane = /*                        */ 0b0000000000000000100000000000000;
const TransitionLane10: Lane = /*                       */ 0b0000000000000001000000000000000;
const TransitionLane11: Lane = /*                       */ 0b0000000000000010000000000000000;
const TransitionLane12: Lane = /*                       */ 0b0000000000000100000000000000000;
const TransitionLane13: Lane = /*                       */ 0b0000000000001000000000000000000;
const TransitionLane14: Lane = /*                       */ 0b0000000000010000000000000000000;
const TransitionLane15: Lane = /*                       */ 0b0000000000100000000000000000000;
const TransitionLane16: Lane = /*                       */ 0b0000000001000000000000000000000;

function requestUpdateLane(fiber: Fiber): Lane {
  // order code...

  // requestCurrentTransition会返回ReactCurrentBatchConfig.transition的值
  const isTransition = requestCurrentTransition() !== NoTransition;
  // transition值
  if (isTransition) {
    // currentEventTransitionLane是全局变量
    if (currentEventTransitionLane === NoLane) {
      // 如果当前事件不存在TransitionLane，则需要获取
      // 同一事件内所有transition都被分配同一个lane
      currentEventTransitionLane = claimNextTransitionLane();
    }
    // 返回currentEventTransitionLane
    return currentEventTransitionLane;
  }
  // order code...
}

function claimNextTransitionLane(): Lane {
  // 通过车道，分配每个新的transition到下一个车道。
  // 在大多数情况下，每个transition都有自己的车道，直到用完所有的lane并循环回到最开始的lane。
  const lane = nextTransitionLane;
  // 将nextTransitionLane左移一位
  nextTransitionLane <<= 1;
  // 用来判断transtion相关的lane是否用完
  // nextTransitionLane按位与TransitionLanes，如果为空，说明transitionLane都用完了
  if ((nextTransitionLane & TransitionLanes) === 0) {
    // 将nextTransitionLane重置为TransitionLane1，即从头开始分配transtionLane
    nextTransitionLane = TransitionLane1;
  }
  // 返回
  return lane;
}
```
从这段代码可以看到，与`transition`相关的`lane`一共有*16*位，说明可以最多存储*16*个不同的`transition`。  

至于为什么需要这么多位来存储`transition`，我猜测可能是为了应付并发场景的上限。虽然`transition`相比其他高优先级是比较低，但是当存在多个`transiton`时，他们之间也会存在优先级的相对关系。虽然都是通过`startTransition`的回调函数触发，但是还是应该有一个执行的前后顺序。先触发的`transition`就应该先执行，而后触发的`transition`就得后执行。  

综上所述，使用点击事件`handleClick`最终会触发四次状态更新。  

执行`setNum`会触发第一次状态更新，它对应的优先级是`SyncLane`。  

执行`setPending(true)`会触发第二次状态更新，它会根据当前存在更新的优先级和`ContinuousEventPriority`之间值更高的，显然`SyncLane`值更高，所以它对应的优先级也是`SyncLane`。 

执行`setPending(false)`会触发第三次状态更新，因为在这之前已经设置了`ReactCurrentBatchConfig.transition = 1`，所以接下来触发更新的优先级应该都是`transitionLane`。因为此时`currentEventTransitionLane`还没有值，所以会通过`claimNextTransitionLane`方法获取`lane`。`nextTransitionLane`的初始值是`TransitionLane1`，所以第三次状态更新对应的优先级就是`TransitionLane1`。  

执行`callback`内的`setCount`会触发第四次状态更新，也会进入获取`transitionLane`的逻辑。此时`currentEventTransitionLane`是有值的，为前一次更新的优先级`TransitionLane1`，所以第四次状态更新对应的优先级也是`TransitionLane1`。  

经过上述的分析结果，再结合**批量更新**：相同优先级的更新会**合并**到一次状态更新流程。  

结论：点击`handleClick`事件最终会触发两次组件渲染。第一次渲染会计算相同高优先级的`setNum`和`setPending(true)`。第二次渲染会计算相同低优先级的`setPending(false)`和`setCount`。
