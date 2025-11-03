# Husky Hooks

本仓库将 `.husky` 目录作为 Git hooks 根目录。首次克隆后运行：

```bash
git config core.hooksPath .husky
```

若已安装 `husky` 包，也可以执行 `pnpm dlx husky install` 来自动配置。
