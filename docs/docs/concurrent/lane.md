## Lane模型

在`Schduler`架构篇中介绍了`Scheduler`中存在优先级的概念。而在`React`中，也存在优先级。这两类优先级虽然有关联，但是并不能混合使用。  

当开启`Concurrent Mode`时，可能存在多种任务：
+ 过期任务或同步任务使用同步优先级
+ 用户交互产生的更新（点击事件或文本输入）使用高优先级
+ 网络请求产生的更新使用普通优先级
+ `Suspense`会使用低优先级

所以，为了应对存在多种优先级任务的情况，`React`需要涉及一套优先级机制：
+ 可以表示优先级的不同
+ 可能同时存在几个相同优先级的更新，即批次的概念
+ 方便进行优先级的相关计算

为了满足如上需求，`React`设计了`lane`模型。

## 优先级

`lane`使用*32*位二进制来表示，位数越小的`lane`表示优先级越高，位数越大的`lane`表示优先级越低。
如代码所示：
```js
export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
export const SyncBatchedLane: Lane = /*                 */ 0b0000000000000000000000000000010;

export const InputDiscreteHydrationLane: Lane = /*      */ 0b0000000000000000000000000000100;
const InputDiscreteLanes: Lanes = /*                    */ 0b0000000000000000000000000011000;

const InputContinuousHydrationLane: Lane = /*           */ 0b0000000000000000000000000100000;
const InputContinuousLanes: Lanes = /*                  */ 0b0000000000000000000000011000000;

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000100000000;
export const DefaultLanes: Lanes = /*                   */ 0b0000000000000000000111000000000;

const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000001000000000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111110000000000000;

const RetryLanes: Lanes = /*                            */ 0b0000011110000000000000000000000;

export const SomeRetryLane: Lanes = /*                  */ 0b0000010000000000000000000000000;

export const SelectiveHydrationLane: Lane = /*          */ 0b0000100000000000000000000000000;

const NonIdleLanes = /*                                 */ 0b0000111111111111111111111111111;

export const IdleHydrationLane: Lane = /*               */ 0b0001000000000000000000000000000;
const IdleLanes: Lanes = /*                             */ 0b0110000000000000000000000000000;

export const OffscreenLane: Lane = /*                   */ 0b1000000000000000000000000000000;
```
其中，同步优先级占用的是第一位：
```js
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
```
从`SyncLane`往下一直到`SelectiveHydrationLane`，优先级逐步降低。  

## 批次

以上这些`lane`的定义中存在多位值，比如：
```js
const InputDiscreteLanes: Lanes = /*                    */ 0b0000000000000000000000000011000;
export const DefaultLanes: Lanes = /*                   */ 0b0000000000000000000111000000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111110000000000000;
```
这就是批次的概念，被称作`lanes`。  
其中`InputDiscreteLanes`是“用户交互”触发更新会拥有的优先级范围。  
`DefaultLanes`是“请求数据返回后触发更新”拥有的优先级范围。  
`TransitionLanes`是`Suspense`、`useTransition`、`useDeferredValue`拥有的优先级范围。  
这其中有个细节，越低优先级的`lanes`占用的位越多。比如`InputDiscreteLanes`占了*2*个位，`TransitionLanes`占了*9*个位。  
原因在于：越低优先级的更新越容易被打断，导致被打断的任务会积压下来，所以需要更多的位来保存这些被打断的任务。相反，最高优的同步更新的`SyncLane`不需要多余的`lanes`，它会最早执行。  

## 优先级计算

既然`lane`对应了二进制的位，那么优先级相关计算采用就是位运算。比如：
*a*和*b*是否存在交集，只需要判断*a*与*b*按位与的结果是否为*0*：
```js
export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane) {
  return (a & b) !== NoLanes;
}
```
计算*b*这个`lanes`是否是*a*对应`lanes`的自己，需要判断*a*与*b*按位与的结果是否为*b*：
```js
export function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane) {
  return (set & subset) === subset;
}
```
将两个`lane`或`lanes`的位合并只需要执行按位或操作：
```js
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}
```
从`set`对应`lanes`中移除`subset`对应`lane（或lanes`），只需要对`subset`的`lane（或lanes）`执行按位非，结果再对`set`执行按位与：
```js
export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;
}
```

## 总结
`React`的优先级模型就是`lane`模型。而`lane`模型是用*32*位二进制数表示的，最高位是符号位，所以实际上会有*31*位参与到计算。通过对`lane`使用位运算，可以实现对`lane`模型的操作，如合并，移除等。