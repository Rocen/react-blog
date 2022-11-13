## 事件系统

在开发中，我们通过JSX语法在标签上绑定的事件是并不是真实的事件，而是React的合成事件。React官网对于合成事件的描述是：
> SyntheticEvent 实例将被传递给你的事件处理函数，它是浏览器的原生事件的跨浏览器包装器。
> 合成事件与浏览器的原生事件不同，也不会直接映射到原生事件。  

也就是说，在`React`应用中，我们所看到的的`React`事件都是“假”的。
+ 给元素绑定的事件，并不是真正的事件处理函数
+ 在冒泡或捕获阶段触发的事件，也不是在冒泡或捕获阶段执行
+ 并且在事件处理函数中拿到的事件源`event`，也不是真正的事件源`event`

那么`React`这么处理的目的是什么呢？  

因为，对于不同的浏览器，不同的事件存在一定的兼容性问题，导致原生事件的表现不一致。最终React想要实现一个浏览器全兼容性的事件系统，以此抹平不同浏览器间的差异。  

所以，`React`对于元素绑定的事件（这个事件是**dispatchEvent**）会统一绑定在应用容器上，通常指的`div.root`标签上。然后再将注册回调函数收集起来，通过执行的顺序来模拟：事件捕获>目标阶段>事件冒泡的事件模型。当然还包括重写事件源`event`对象。

## 事件绑定

事件系统的入口函数`listenToAllSupportedEvents`会通过`ReactDOM.createRoot`或者`ReactDOM.render`方法调用。从`listenToAllSupportedEvents`方法开始会依次执行事件绑定和事件触发。
```js
const listeningMarker =
  '_reactListening' +
  Math.random()
    .toString(36)
    .slice(2);

function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
    // 如果容器元素上没有监听过的标记
    if (!(rootContainerElement: any)[listeningMarker]) {
        (rootContainerElement: any)[listeningMarker] = true;
        // allNativeEvents
        allNativeEvents.forEach(domEventName => {
        // We handle selectionchange separately because it
        // doesn't bubble and needs to be on the document.
        if (domEventName !== 'selectionchange') {
            // 不需要委托的事件，如click等事件是需要委托在容器元素上，通过冒泡的方式触发
            if (!nonDelegatedEvents.has(domEventName)) {
                // 监听冒泡事件
                listenToNativeEvent(domEventName, false, rootContainerElement);
            }
            // 监听捕获事件，其他类型的事件需要绑定在元素本身上
            listenToNativeEvent(domEventName, true, rootContainerElement);
        }
    });
}

function listenToNativeEvent(
  domEventName: DOMEventName,
  isCapturePhaseListener: boolean,
  target: EventTarget,
): void {
  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener,
  );
}

function addTrappedEventListener(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  isCapturePhaseListener: boolean,
  isDeferredListenerForLegacyFBSupport?: boolean,
) {
    // 创建事件监听容器
    let listener = createEventListenerWrapperWithPriority(
        targetContainer,
        domEventName,
        eventSystemFlags,
    );
    targetContainer = targetContainer

    let unsubscribeListener;

    if (isCapturePhaseListener) {
        // 捕获阶段
        // addEventCaptureListener = targetContainer.addEventListener(domEventName, listener, true);
        unsubscribeListener = addEventCaptureListener(
            targetContainer,
            domEventName,
            listener,
        );
    } else {
        // 冒泡阶段
        // addEventBubbleListener = targetContainer.addEventListener(domEventName, listener, false);
        unsubscribeListener = addEventBubbleListener(
            targetContainer,
            domEventName,
            listener,
        );
    }
}
```
这段代码最重要的一段就是在`addTrappedEventListener`函数中执行`addEventCaptureListener`或`addEventBubbleListener`方法，这两个方法的本质都是调用容器`dom.addEventListener`方法以特定的事件类型绑定`listener`回调函数。在上边可以看到`listener`是通过`createEventListenerWrapperWithPriority`函数创建出来的，那`createEventListenerWrapperWithPriority`这个函数是怎么定义的呢？
```js
function createEventListenerWrapperWithPriority(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
): Function {
    // 获取事件的优先级
    // 如click事件对应的优先级是DiscreteEventPriority，对应的lane模型是SyncLane，优先级最高
    // 如drag，mousemove，scroll等事件对应的优先级是ContinuousEventPriority，对应的lane模型是InputContinuousLane，优先级比较高
    const eventPriority = getEventPriority(domEventName);
    let listenerWrapper;
    switch (eventPriority) {
        // click对应的dispatch就是dispatchDiscreteEvent，
        case DiscreteEventPriority:
          listenerWrapper = dispatchDiscreteEvent;
          break;
        // 鼠标移动等事件对应的dispatch就是dispatchContinuousEvent
        case ContinuousEventPriority:
          listenerWrapper = dispatchContinuousEvent;
          break;
        case DefaultEventPriority:
        default:
          listenerWrapper = dispatchEvent;
          break;
    }
    return listenerWrapper.bind(
        null,
        domEventName,
        eventSystemFlags,
        targetContainer,
    );
}

function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent,
) {
  // 首先获取到当前事件的优先级
  const previousPriority = getCurrentUpdatePriority();
  try {
    // 然后设置当前触发事件的优先级
    // 如触发了click事件就会设置DiscreteEventPriority事件优先级，对应的lane模型是SyncLane
    setCurrentUpdatePriority(DiscreteEventPriority);
    // 然后执行这个click事件
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    // 当执行完click事件需要返还前一个事件的优先级
    setCurrentUpdatePriority(previousPriority);
  }
}
```
以上这两部分代码可以看做是事件合成或事件绑定，主要的工作就是为容器元素调用`addEventListener`方法以事件类型和回调函数绑定监听器。并且这个回调函数并不是用户在`React Element`上注册的回调函数，而是一个名为`dispatchEvent`的方法。以`click`方法为例，当在某个元素上触发`click`方法，根据*DOM事件流*会从目标元素冒泡到容器元素，并触发容器元素的`click`事件对应的回调函数即`dispatchEvent`。最终，通过`dispatchEvent`方法就会进入到`React`事件系统的事件触发阶段。

## 事件触发

接下来，让我们看下事件触发阶段都做了哪些工作。  

如代码所示：
```js
function dispatchEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): void {
    // some code...

  // 尝试触发事件
    const blockedOn = attemptToDispatchEvent(
        domEventName,
        eventSystemFlags,
        targetContainer,
        nativeEvent,
    );

    if (blockedOn === null) {
        // We successfully dispatched this event.
        if (allowReplay) {
          clearIfContinuousEvent(domEventName, nativeEvent);
        }
        return;
    }
}

function attemptToDispatchEvent(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): null | Container | SuspenseInstance {

  const nativeEventTarget = getEventTarget(nativeEvent);
  let targetInst = getClosestInstanceFromNode(nativeEventTarget);
  // some code...

  // 通过插件事件系统触发事件
  dispatchEventForPluginEventSystem(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer,
  );
  // 没有被阻塞（为了处理特殊情况）
  return null;
}

function dispatchEventForPluginEventSystem(
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber,
  targetContainer: EventTarget,
): void {
  let ancestorInst = targetInst;
  // 批量更新
  batchedUpdates(() =>
    // 通过插件触发事件
    dispatchEventsForPlugins(
      domEventName,
      eventSystemFlags,
      nativeEvent,
      ancestorInst,
      targetContainer,
    ),
  );
}

function dispatchEventsForPlugins() {
    // DOM节点
    const nativeEventTarget = getEventTarget(nativeEvent);
    // 触发事件队列
    const dispatchQueue: DispatchQueue = [];
    // 收集触发事件队列
    extractEvents(
        dispatchQueue,
        domEventName,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
        targetContainer,
    );
    // 执行触发事件队列
    processDispatchQueue(dispatchQueue, eventSystemFlags);
}
```
以上多个方法以线性关系依次调用，最后执行的方法是`dispatchEventsForPlugins`。这个方法的目的就是按顺序执行通过`React`事件注册的回调函数。  

这部分涉及到代码比较多，所以我们分两段看下。先是收集触发事件队列的部分：
```js
function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );
}

function extractEvents(
  dispatchQueue: DispatchQueue,
  domEventName: DOMEventName,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
): void {
    // domEventName是否有对应的React事件
    const reactName = topLevelEventsToReactNames.get(domEventName);
    if (reactName === undefined) {
        return;
    }
    // 默认的合成事件event
    let SyntheticEventCtor = SyntheticEvent;
    // React事件名称
    let reactEventType: string = domEventName;
    switch (domEventName) {
        case 'click':
            // 定义事件源event
            SyntheticEventCtor = SyntheticMouseEvent; 
            break;
        // order code...

        default:
            break;
    }
    // 是否是捕获阶段
    const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
    if (
        enableCreateEventHandleAPI &&
        eventSystemFlags & IS_EVENT_HANDLE_NON_MANAGED_NODE
    ) {
        // order code...

    } else {
        // 是否只计算目标阶段
        // 这里当不在捕获阶段即inCapturePhase为false的话，accumulateTargetOnly就会为true，
        // 当accumulateTargetOnly为true就不会收集所有注册的回调函数，只会收集目标节点注册的回调函数
        // 在此React给出的解释是：有些事件不会在浏览器中冒泡。我们将尝试通过在React中不冒泡来接近浏览器的行为。会从onScroll不冒泡开始，然后展开。
        const accumulateTargetOnly = !inCapturePhase && domEventName === 'scroll';
        // 收集的监听函数队列
        const listeners = accumulateSinglePhaseListeners(
            targetInst,
            reactName,
            nativeEvent.type,
            inCapturePhase,
            accumulateTargetOnly,
            nativeEvent,
        );
        if (listeners.length > 0) {
            // 创建事件源event
            const event = new SyntheticEventCtor(
                reactName,
                reactEventType,
                null,
                nativeEvent,
                nativeEventTarget,
            );
            // 事件源event和监听函数队列组成的对象
            dispatchQueue.push({event, listeners});
        }
    }
}
// 收集单个阶段的监听器，捕获阶段或冒泡阶段
function accumulateSinglePhaseListeners(
  targetFiber: Fiber | null,
  reactName: string | null,
  nativeEventType: string,
  inCapturePhase: boolean,
  accumulateTargetOnly: boolean,
  nativeEvent: AnyNativeEvent,
): Array<DispatchListener> {
    // onClickCapture 为React事件的捕获事件
    const captureName = reactName !== null ? reactName + 'Capture' : null;
    // 在捕获阶段使用的事件名称是onClickCapture，不是捕获阶段则使用的事件名称是onClick
    const reactEventName = inCapturePhase ? captureName : reactName;
    // 初始化监听队列
    let listeners: Array<DispatchListener> = [];
    // instance指的是Fiber节点
    let instance = targetFiber;
    // lastHostComponent指的是真实的DOM节点
    let lastHostComponent = null;

    // 从目标Fiber节点一直向上遍历直到根节点
    while (instance !== null) {
        const {stateNode, tag} = instance;
        // 原生节点，并且存在真实DOM节点，如div，p标签等
        if (tag === HostComponent && stateNode !== null) {
            lastHostComponent = stateNode;

            // 正确的react合成事件名称
            if (reactEventName !== null) {
                // reactEventName是React合成事件的名字,如onClick 
                // 通过props[registrationName]就能取到onClick对应的回调函数了
                // 下面这行代码可以简化为：listener = props[registrationName]
                const listener = getListener(instance, reactEventName); 
                if (listener != null) {
                    // 将监听的相关内容保存到listeners
                    listeners.push(
                        // createDispatchListener就是根据传入的参数作为属性，创建并返回一个对象
                        // {
                        //     instance, 回调函数对应的Fiber节点
                        //     listener, 回调函数
                        //     currentTarget, 回调函数对应的DOM节点
                        // };
                        createDispatchListener(instance, listener, lastHostComponent),
                    );
                }
            }
        }
        // 只收集目标阶段则会直接退出循环
        if (accumulateTargetOnly) {
            break;
        }
        // 向上遍历,寻找父级Fiber节点
        instance = instance.return;
    }
    return listeners;
}
// 收集单个阶段的监听器，捕获阶段和冒泡阶段
function accumulateTwoPhaseListeners(
  targetFiber: Fiber | null,
  reactName: string,
): Array<DispatchListener> {
  const captureName = reactName + 'Capture';
  const listeners: Array<DispatchListener> = [];
  let instance = targetFiber;

  // 从目标Fiber节点一直向上遍历直到根节点
  while (instance !== null) {
    const {stateNode, tag} = instance;
    // 原生节点，并且存在真实DOM节点，如div，p标签等
    if (tag === HostComponent && stateNode !== null) {
      const currentTarget = stateNode;
      // reactEventName是React合成事件的名字,如onClick 
      // 通过props[registrationName]就能取到onClick对应的回调函数了
      // 下面这行代码可以简化为：listener = props[registrationName]

      // 获取捕获阶段的监听器
      const captureListener = getListener(instance, captureName);
      if (captureListener != null) {
        // 重点，unshift到监听器队列的前面
        listeners.unshift(
          // createDispatchListener就是根据传入的参数作为属性，创建并返回一个对象
          // {
          //     instance, 回调函数对应的Fiber节点
          //     listener, 回调函数
          //     currentTarget, 回调函数对应的DOM节点
          // };
          createDispatchListener(instance, captureListener, currentTarget),
        );
      }
       // 获取冒泡阶段的监听器
      const bubbleListener = getListener(instance, reactName);
      if (bubbleListener != null) {
         // 重点，push到监听器队列的后面
        listeners.push(
          // createDispatchListener就是根据传入的参数作为属性，创建并返回一个对象
          // {
          //     instance, 回调函数对应的Fiber节点
          //     listener, 回调函数
          //     currentTarget, 回调函数对应的DOM节点
          // };
          createDispatchListener(instance, bubbleListener, currentTarget),
        );
      }
    }
    // 向上遍历,寻找父级Fiber节点
    instance = instance.return;
  }
  return listeners;
}
```
从这段代码可以看到在`accumulateSinglePhaseListeners`方法中有一个`while循`环，循环的目的是从目标`Fiber`节点一直向上遍历直到根节点`rootFiber`，收集这一条路径上通过`React`合成事件注册的回调函数，然后依次*push*到数组中。  

最终收集的监听器队列和对应的事件源`event`保存在`dispatchQueue`中。接下来要做的就是调用`processDispatchQueue`函数遍历`dispatchQueue`并执行监听器队列。
```js
function processDispatchQueue(
  dispatchQueue: DispatchQueue,
  eventSystemFlags: EventSystemFlags,
): void {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  for (let i = 0; i < dispatchQueue.length; i++) {
    const {event, listeners} = dispatchQueue[i];
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
    //  event system doesn't use pooling.
  }
}

function processDispatchQueueItemsInOrder(
  event: ReactSyntheticEvent,
  dispatchListeners: Array<DispatchListener>,
  inCapturePhase: boolean,
): void {
  let previousInstance;
  // 区分是否是捕获阶段
  if (inCapturePhase) {
        // 如果是捕获阶段，所以就从最后一项开始遍历直到第一项，相对应的DOM流就是捕获阶段然后进入向下的目标阶段
        // 节点的顺序 a -> b -> c -> d （a是目标节点，d根节点）
        // 收集回调函数的顺序也是 [a, b, c, d]
        // 捕获阶段是从根节点向下的顺序进行的，所以最终的执行回调函数的顺序是 d -> c -> b -> a
        for (let i = dispatchListeners.length - 1; i >= 0; i--) {
          const {instance, currentTarget, listener} = dispatchListeners[i];
          if (instance !== previousInstance && event.isPropagationStopped()) {
              return;
          }
          executeDispatch(event, listener, currentTarget);
          previousInstance = instance;
        }
  } else {
        // 因为是冒泡阶段，所以就从第一项开始遍历直到最后一项，相对应的DOM事件流就是目标阶段然后进入向上的冒泡阶段
        // 节点的顺序 a -> b -> c -> d （a是目标节点，d根节点）
        // 收集回调函数的顺序也是 [dCapture, cCapture, bCapture, aCapture, a, b, c, d];
        // 带有Capture后缀表示捕获事件
        // 捕获阶段是从根节点向下的顺序进行的，所以最终的执行回调函数的顺序是 dCapture -> cCapture -> bCapture -> aCapture -> a -> b -> c -> d
        for (let i = 0; i < dispatchListeners.length; i++) {
          const {instance, currentTarget, listener} = dispatchListeners[i];
          // 对于合成事件源event对象，定义了isPropagationStopped方法，方法的返回值就是true
          // 当调用了isPropagationStopped则会进入到条件语句里面直接return掉，后续的回调函数也就不糊执行了，达到了阻止冒泡的目的
          if (instance !== previousInstance && event.isPropagationStopped()) {
              return;
          }
          // 执行listener中保存的回调函数
          executeDispatch(event, listener, currentTarget);
          previousInstance = instance;
        }
  }
}


// 因为executeDispatch会调用一系列的函数，所以下面是简化后的代码，只保留了最后回调函数执行的过程
function executeDispatch(
  event: ReactSyntheticEvent,
  listener: Function,
  currentTarget: EventTarget,
): void {
  invokeGuardedCallbackImpl.apply(null, arguments)
}

if (
    typeof window !== 'undefined' 
    && typeof window.dispatchEvent === 'function' 
    && typeof document !== 'undefined' 
    && typeof document.createEvent === 'function'
) {
    // 创建一个虚拟dom
    var fakeNode = document.createElement('react');

    invokeGuardedCallbackImpl = function invokeGuardedCallbackDev(name, func, context, a, b, c, d, e, f) {
        // 创建一个事件名
        var evt = document.createEvent('Event');
        var didCall = false; 

        var windowEvent = window.event;

        var windowEventDescriptor = Object.getOwnPropertyDescriptor(window, 'event');

        function restoreAfterDispatch() {
            // 在执行回调函数后立刻移除回调函数，防止出现嵌套调用
            fakeNode.removeEventListener(evtType, callCallback, false);

            if (
                typeof window.event !== 'undefined' &&
                window.hasOwnProperty('event')
            ) {
                window.event = windowEvent;
            }
        }
        // 获取回调函数的参数
        var funcArgs = Array.prototype.slice.call(arguments, 3);
        // 调用回调函数
        function callCallback() {
            didCall = true;
            restoreAfterDispatch();
            // 终于!!!在这里执行回调函数，并传入上下文和参数
            func.apply(context, funcArgs);
            didError = false;
        } 
        // 定义一个假的事件类型
        var evtType = "react-" + (name ? name : 'invokeguardedcallback'); 
        // 在虚拟DOM节点上以自定义事件类型绑定调用回调函数
        fakeNode.addEventListener(evtType, callCallback, false); 
        // 初始化evtType实例
        evt.initEvent(evtType, false, false);
        // 在虚拟DOM节点上callCallback方法，然后执行回调函数
        fakeNode.dispatchEvent(evt);

        if (windowEventDescriptor) {
            Object.defineProperty(window, 'event', windowEventDescriptor);
        }

        // handle throw error...
    }
}
```
至此，`React`事件系统相关的源码终于介绍完了。需要说明的是，为了方便，以上的代码主要是以`click`这种简单事件为例，并且触发的方式也是比较简单的。除此之外，还有像选择事件、鼠标移动事件、输入事件等。每种事件都做了许多额外的处理工作，并且也有各自不同的事件源`event`对象。  

## 总结

`React`的事件系统主要分成两个阶段，事件绑定和事件触发。  
+ 事件绑定阶段：会在容器根节点（`ReactDOM.createRoot`的一个参数或`ReactDOM.render`的第二个参数）上绑定一个`dispatchEvent`方法。
+ 事件触发阶段：当在目标节点触发一个点击事件后，根据`DOM`事件流向上冒泡到容器根节点，触发容器根节点的`dispatchEvent`方法。`dispatchEvent`方法会从目标`Fiber`节点一直向上遍历到容器根节点，同时收集遍历到`Fiber`节点上的注册事件的相关信息（`Fiber`节点和`callback`回调函数），然后依次push到监听器队列中，然后再和对应的事件源`event`组成对象保存到`dispatchQueue`数组中。接着根据是否是**捕获阶段**来决定回调函数的**执行顺序**，最后遍历`dispatchQueue`并调用`executeDispatch`方法执行*callback回调函数*。
