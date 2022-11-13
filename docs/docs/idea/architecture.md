## React新架构

React的架构是经历过大的重构的，目的是新的架构需要支持异步可中断更新。

### React15
可以分为两层：  
+ Reconciler（协调器）—— 负责找出变化的组件
+ Renderer（渲染器）—— 负责将变化的组件渲染到页面上  

### React16
分为三层：
+ Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入Reconciler
+ Reconciler（协调器）—— 负责找出变化的组件
+ Renderer（渲染器）—— 负责将变化的组件渲染到页面上  

其中，Reconciler虽然名称没变，但是内部也是重构过的，从原来的`Stack Reconciler`重构为`Fiber Reconciler`。  

顾名思义，新的`Reconciler`内部使用的是`Fiber`架构。

### 术语
+ `Reconciler`工作的阶段被称为`render`阶段。因为在该阶段会调用组件的`render`方法。
+ `Renderer`工作的阶段被称为`commit`阶段。就像你完成一个需求的编码后执行`git commit`提交代码。commit阶段会把`render`阶段提交的信息渲染在页面上。
+ `render`与`commit`阶段统称为`work`，即`React`在工作中。相对应的，如果任务正在`Scheduler`内调度，就不属于`work`。


