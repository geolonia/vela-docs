---
layout: home
---

<script setup>
import { withBase } from 'vitepress'

if (typeof window !== 'undefined') {
  window.location.href = withBase('/en/')
}
</script>
