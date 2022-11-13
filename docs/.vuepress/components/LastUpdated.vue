<template>
    
</template>

<script>
export default {
    props: ['slot-key'],
    mounted() {
        this.$page.lastUpdated = "2022/07/17 上午10:00:00";
    }
}
</script>