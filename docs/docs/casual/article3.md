## Suspense对React的意义
---
Suspense
### React的迭代过程
React从v16到v18主打的特性经历了三次大的变化：
+ v16：Async Mode（异步模式）
+ v17：Concurrent Mode（并发模式）
+ v18：Concurrent Render（并发更新）  
要了解三次变化的意义，需要先了解React中一个容易混淆的概念--render。
ClassComponent的render函数执行时被称为render。
```js
class App extends Component {
  render() {
    // ...这是render函数
  }
}
```
而将render的结果渲染到页面的过程，被称为commit。
Async Mode的目的是让render变为异步、可中断的。  
Concurrent Mode的目的是让commit在用户的感知上是并发的。  
由于Concurrent Mode包含breaking change，所以v18提出了Concurrent Render，减少了开发者迁移的成本。  
那么“让commit在用户的感知上是并发的”是什么意思呢？  
```js
const App = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setInterval(() => {
      setCount(count => count + 1);
    }, 1000);
  }, []);
  
  return (
    <>
      <Suspense fallback={<div>loading...</div>}>
        <Sub count={count} />
      </Suspense>
      <div>count is {count}</div>
    </>
  );
};
```
其中，每过一秒都会触发一次更新，将状态count更新为count => count + 1，在Sub中会发起异步的请求，请求返回前，包裹Sub的Suspense会渲染fallback。  
假设请求三秒后返回，理想的情况下，请求发起后页面会依次显示：
```js
// Sub内请求发起前
<div class=“sub”>I am sub, count is 0</div>
<div>count is 0</div>

// Sub内请求发起第1秒
<div>loading...</div>
<div>count is 1</div>

// Sub内请求发起第2秒
<div>loading...</div>
<div>count is 2</div>

// Sub内请求发起第3秒
<div>loading...</div>
<div>count is 3</div>

// Sub内请求成功后
<div class=“sub”>I am sub, request success, count is 4</div>
<div>count is 4</div>
```
从用户的视角观察，页面中有两个任务在并发执行：
+ 请求Sub的任务（即第一个div的变化）
+ 改变count的任务（即第二个div的变化）  
Suspense带来的页面中多任务并发执行的感觉，就是Concurrent在React中意义。  
### Suspense的意义
可以看到，对于Concurrent，Suspense是必不可少的一环。  
可以任务，Suspense的作用是“划分页面中需要并发渲染的部分”。  
比如上例中，通过Suspense将“请求Sub的任务”和“改变count的任务”划分开，从视觉上并发执行。  
当明确了Suspense的意义后，就会发现，React接下来做的事就是不断的扩充Suspense的场景，也就是将更多的场景纳入到并发渲染的范畴中。  
比如：
+ React.lazy
+ useTransition
+ useDeferredValue  

未来还会假如：
+ Server Component
+ Selective Hydration  

### 总结
React的发展历程是： 从“同步”到“异步”，再到“并发”。  
Suspense的作用的就是“划分页面中需要并发渲染的部分”。
所以，React接下来发展的方向应该是：不断的扩充可以使用并发的场景。

