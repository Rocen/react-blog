module.exports = {
    head: [
        [
            'link',
            {
                rel: 'icon', 
                href: 'faviocn.ico'
            }
        ]
    ],
    title: 'React',
    description: 'React',
    base: '/react-blog/',
    themeConfig: {
        nav: [
            {
                text: '🆒 github',
                link: 'https://github.com/Rocen',
                icon: 'reco-github',
                target:'_blank'
            }
        ],
        sidebar: [
            {
                title:'开始',
                collapsable: false,
                path: '/',
                children: [
                    {
                        title: "目录",
                        path: "/docs/start/directory"
                    },
                    {
                        title: "拉取源码",
                        path: "/docs/start/pullSource"
                    }
                ]
            },
            {
                title: "理念", 
                children: [
                    {
                        title: "React理念",
                        path: "/docs/idea/concept",
                    },
                    {
                        title: "React架构",
                        path: "/docs/idea/architecture",
                    },
                    {
                        title: "Fiber架构的实现原理",
                        path: "/docs/idea/fiber"
                    },
                    {
                        title: "Fiber结构的工作原理",
                        path: "/docs/idea/doubleCache"
                    },
                    {
                        title: "React工作流程",
                        path: "/docs/idea/workProcess"
                    },
                ]
            },
            {
                title: "架构",
                children: [
                    {
                        title: "Scheduler（调度器）",
                        path: "/docs/architecture/scheduler",
                    },
                    {
                        title: "Reconciler（协调器）",
                        path: "/docs/architecture/reconciler",
                    },
                    {
                        title: "Renderer（渲染器）",
                        path: "/docs/architecture/renderer",
                    }
                ]
            },
            {
                title: "原理", 
                children: [
                    {
                        title: "diff算法",
                        path: "/docs/principle/diff"
                    },
                    {
                        title: "状态更新",
                        path: "/docs/principle/updateState"
                    },
                ]
            },
            {
                title: "概念",
                children: [
                    {
                        title: "生命周期",
                        path: "/docs/concept/lifeCycle"
                    },
                    {
                        title: "事件系统",
                        path: "/docs/concept/eventSystem"
                    },
                    {
                        title: "错误边界",
                        path: "/docs/concept/errorBoundary"
                    },
                ]
            },
            {
                title: "Hooks", 
                children: [
                    {
                        title: "useState和useReducer",
                        path: "/docs/hooks/useStateAnduseReducer"
                    },
                    {
                        title: "useEffect",
                        path: "/docs/hooks/useEffect"
                    },
                    {
                        title: "useEffect的执行",
                        path: "/docs/hooks/executeUseEffect"
                    },
                    {
                        title: "useRef",
                        path: "/docs/hooks/useRef"
                    },
                    {
                        title: "useMemo和useCallback",
                        path: "/docs/hooks/useMemoAnduseCallback"
                    },
                    {
                        title: "useTransition",
                        path: "/docs/hooks/useTransition"
                    },
                ]
            },
            {
                title: "Concurrent Mode",
                children: [
                    {
                        title: "Scheduler工作流程",
                        path: "/docs/concurrent/scheduler"
                    },
                    {
                        title: "lane模型",
                        path: "/docs/concurrent/lane"
                    },
                    {
                        title: "批量更新",
                        path: "/docs/concurrent/batchedUpdates"
                    },
                    {
                        title: "Suspense",
                        path: "/docs/concurrent/suspense"
                    },
                    {
                        title: "饥饿问题",
                        path: "/docs/concurrent/starve"
                    },
                ]
            },
            {
                title: "实现",
                children: [
                    {
                        title: "实现简易useState",
                        path: "/docs/implement/useState"
                    }
                ]
            },
            {
                title: "发现",
                children: [
                    {
                        title: "组件渲染和性能优化",
                        path: "/docs/find/componentRenderAndOptimize"
                    },
                    {
                        title: "setState和useState的区别",
                        path: "/docs/find/differentBetweenSetStateAndUseState"
                    },
                    {
                        title: "useState是同步还是异步",
                        path: "/docs/find/isUseStateSyncOrAsync"
                    },
                    {
                        title: "React中的性能优化",
                        path: "/docs/find/performanceOptimize"
                    }
                ]
            }
        ]
    },
    locales: {
        '/': {
            lang: 'zh-CN'
        }
    },
    lastUpdated: 'Last Updated',
    plugins: [
        '@vuepress/back-to-top',
        [
            "vuepress-plugin-nuggets-style-copy", 
            {
                copyText: "复制代码",
                tip: {
                    content: "复制成功"
                }
            }
        ]
    ]
}