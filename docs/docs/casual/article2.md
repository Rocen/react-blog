## 优先级
---
```js
function App() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const BtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setA(9000);
      BtnRef.current?.click();
    }, 2000);
  }, []);

  return (
    <div>
      <button 
        ref={BtnRef} 
        onClick={() => setB(1)}>
        b: {b}
      </button>
      {Array(a).fill(0).map((_, i) => {
        return <div key={i}>{a}</div>;
      })}
    </div>
  );
}
```
现在React有两种挂载根节点的方式：
```js
// v18之前创建应用的方式
const rootElement = document.getElementById("root");
ReactDOM.render(<App/>, rootElement);

// v18创建应用的方式
const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);
```
虽然，在页面中两者用肉眼看着没有区别。但是如果使用源码进行调试，在commitRootImpl方法中打上断点然后debugger的话，是可以看出页面渲染的顺序的。
### 更新的优先级
需要明确的直到，不同方式触发的更新在React内部是拥有不同的优先级的，通过onClick回调中触发的更新是最高优的，即同步优先级。  
而使用useState的dispatch方法，触发的更新是较低一点的，即默认优先级。  
在React18中，如果不使用并发特性，所有的更新都应该是同步、不可中断的。尽管，更新的流程是这样的，但是在更新的流程开始之前还需要通过Scheduler进行调度的工作。  
具体的执行流程如下：
+ a触发更新，更新的优先级为“默认优先级”
+ 调度a的更新，调度的优先级也为“默认优先级”
+ b触发更新，更新的优先级为“同步优先级”
+ 调度b的更新，调度的优先级也为“同步优先级”
+ 在Scheduler中，虽然正在调度a的更新，但是此时出现了拥有更好优先级的b，所以先取消a的更新，转而开始调度b的更新
+ b的调度流程结束，开始同步、不可中断的执行b的更新流程
+ 渲染b的更新到页面中
+ 开始调度a的更新
+ a的调度流程结束，开始同步、不可中断的而执行a的更新流程
+ 渲染a的更新到页面中
由此可见，只要采用ReactDOM.createRoot方法创建的应用，内部优先级的存在会一直影响React的工作流程。  
与使用并发特性的区别是：
+ 只有默认优先级与同步优先级
+ 优先级只会影响调度，而不会中断更新的执行
### 老版本React的历史包袱
```js
onClick() {
  setTimeout(() => {
    this.setState({a: 1});
    console.log(a); // 1
  })
}
```
在异步回调函数中调用的this.setState会同步执行。这是React早起实现批处理时的瑕疵，并不是有意而为之的特性。
当React使用Fiber架构重构后，完全可以避免这个瑕疵，但为了实现与老版本的行为保持一致，刻意实现成这样。
所以，在使用ReactDOM.render创建应用时，这两个更新并不会受到优先级的影响，但是会收到兼容老版本的影响。  
相应的执行流程：
+ a触发更新，因为在异步回调函数中触发，所以会同步执行更新流程
+ 渲染a的更新到页面中
+ b触发更新，因为在异步回调函数中触发，所以会同步执行更新流程
+ 渲染b的更新到页面中
### 总结
虽然，新旧版本React存在表现行为不一致的情况，但是这种情况是非常少见的，并且在实际应用中也不一定能够发现。除非通过调试源码的行为，才勉强能够发现这种细小的问题。  
React作为一款主流框架，在经历重大版本更新后依然可以保持框架行为前后的一致性，实属不易。