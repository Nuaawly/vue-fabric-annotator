<template>
    <div class="main-container">
        <!-- Loading 遮罩 -->
        <div v-if="isLoading" class="loading-overlay">
            <div class="loader"></div>
        </div>

        <!-- 左侧边栏 -->
        <div class="left-sidebar" :class="{ 'is-expanded': isLeftSidebarExpanded }">

            <div class="ls-header">
                <!-- 迷你模式过滤器 -->
                <div class="header-content mini-view">
                    <div class="mini-filter-col">
                        <el-tooltip content="全部" placement="right" :show-after="500">
                            <div class="filter-icon-btn" :class="{ active: activeImageFilter === 'all' }"
                                @click="activeImageFilter = 'all'">
                                <el-icon>
                                    <Menu />
                                </el-icon>
                            </div>
                        </el-tooltip>
                        <el-tooltip content="标注中" placement="right" :show-after="500">
                            <div class="filter-icon-btn" :class="{ active: activeImageFilter === 'in_progress' }"
                                @click="activeImageFilter = 'in_progress'">
                                <el-icon>
                                    <Edit />
                                </el-icon>
                            </div>
                        </el-tooltip>
                        <el-tooltip content="已标注" placement="right" :show-after="500">
                            <div class="filter-icon-btn" :class="{ active: activeImageFilter === 'annotated' }"
                                @click="activeImageFilter = 'annotated'">
                                <el-icon>
                                    <Check />
                                </el-icon>
                            </div>
                        </el-tooltip>
                    </div>
                    <div class="ls-stat">
                        {{ images.length > 0 ? currentImageIndex + 1 : 0 }} / {{ images.length }}
                    </div>
                </div>

                <!-- 展开模式过滤器 -->
                <div class="header-content full-view">
                    <div class="ls-title">图片列表</div>
                    <div class="ls-filter">
                        <span class="filter-item" :class="{ active: activeImageFilter === 'all' }"
                            @click="activeImageFilter = 'all'">全部</span>
                        <span class="filter-item" :class="{ active: activeImageFilter === 'in_progress' }"
                            @click="activeImageFilter = 'in_progress'">标注中</span>
                        <span class="filter-item" :class="{ active: activeImageFilter === 'annotated' }"
                            @click="activeImageFilter = 'annotated'">已标注</span>
                    </div>
                    <div class="ls-stat">
                        共 {{ filteredImageList.length }} 张
                    </div>
                </div>
            </div>

            <!-- 图片列表主体 -->
            <div class="ls-body custom-scrollbar">
                <div class="img-card" v-for="img in filteredImageList" :key="img.id"
                    :class="{ 'active': img.realIndex === currentImageIndex, 'is-selected': selectedImageIds.has(img.id) }"
                    @click="jumpToImage(img.realIndex)">

                    <!-- 选中复选框 -->
                    <div class="img-select-checkbox" :class="{ 'checked': selectedImageIds.has(img.id) }"
                        @click.stop="toggleImageSelection(img, $event)">
                        <el-icon v-if="selectedImageIds.has(img.id)">
                            <Check />
                        </el-icon>
                    </div>

                    <!-- 缩略图 -->
                    <div class="img-thumb">
                        <el-image :src="img.url" fit="cover" lazy>
                            <template #placeholder>
                                <div class="image-slot">...</div>
                            </template>
                            <template #error>
                                <div class="image-slot">
                                    <el-icon>
                                        <Picture />
                                    </el-icon>
                                </div>
                            </template>
                        </el-image>
                        <!-- 状态角标 -->
                        <div class="status-badge saved" v-if="img.isSaved">
                            <el-icon>
                                <Check />
                            </el-icon>
                        </div>
                        <div class="status-badge progressing" v-else>
                            <el-icon>
                                <Edit />
                            </el-icon>
                        </div>
                    </div>
                    <div class="img-name" :title="img.name">{{ img.name }}</div>
                </div>

                <div v-if="filteredImageList.length === 0" class="empty-list">暂无数据</div>
            </div>

            <!-- 底部操作栏 -->
            <div class="ls-actions">
                <div class="action-content mini-view">
                    <el-tooltip :content="`已选 ${selectedImageIds.size} 张，点击下载`" placement="right">
                        <el-button type="primary" size="small" circle :disabled="selectedImageIds.size === 0"
                            @click="openDownloadDialog('batch')">
                            <el-icon>
                                <Download />
                            </el-icon>
                        </el-button>
                    </el-tooltip>
                    <span class="mini-badge" v-if="selectedImageIds.size > 0">{{ selectedImageIds.size }}</span>
                </div>

                <div class="action-content full-view">
                    <div class="action-left">
                        <el-checkbox :model-value="isAllInViewSelected" :indeterminate="isIndeterminate"
                            @change="handleSelectAllChange" :disabled="filteredImageList.length === 0"
                            class="select-all-checkbox" size="small">
                            全选
                        </el-checkbox>
                        <div class="action-divider" v-show="isIndeterminate || isAllInViewSelected"></div>
                        <transition name="el-fade-in-linear">
                            <div v-if="isIndeterminate || isAllInViewSelected" class="clear-btn-wrapper"
                                @click="clearSelectionInView">
                                <el-icon>
                                    <Delete />
                                </el-icon>
                                <span>清空</span>
                            </div>
                        </transition>
                    </div>
                    <div class="action-right">
                        <div class="count-tag" v-if="selectedImageIds.size > 0">
                            {{ selectedImageIds.size }}
                        </div>
                        <el-button type="primary" size="small" :disabled="selectedImageIds.size === 0"
                            @click="openDownloadDialog('batch')" class="download-btn-compact">
                            <el-icon>
                                <Download />
                            </el-icon>
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 侧边栏折叠按钮 -->
            <div class="ls-toggle-btn" @click="isLeftSidebarExpanded = !isLeftSidebarExpanded">
                <el-icon>
                    <CaretLeft v-if="isLeftSidebarExpanded" />
                    <CaretRight v-else />
                </el-icon>
            </div>
        </div>

        <!-- 画布区域 -->
        <div class="canvas-area dot-bg" ref="canvasContainerRef">

            <!-- 顶部悬浮工具栏 -->
            <div class="floating-toolbar top-bar">
                <div class="left-panel">
                    <el-button class="icon-btn" circle @click="handleBackClick">
                        <el-icon>
                            <Back />
                        </el-icon>
                    </el-button>
                    <div class="title-group">
                        <!-- 修复 $t 为 t -->
                        <span class="main-title">{{ t('label.imageAnnotation.segment.trainingName') }}</span>
                        <span class="sub-title">{{ trainingName }}</span>
                    </div>

                    <div class="divider-vertical"></div>
                    <div class="global-label-group">
                        <span class="label-text">Global Label:</span>
                        <el-input v-model.trim="globalLabel" placeholder="Global Label" size="small"
                            class="global-input" :disabled="images.length === 0" />
                    </div>
                </div>

                <!-- 完整工具栏 (非紧凑模式) -->
                <div class="right-panel" v-if="!isCompactMode">
                    <el-tooltip content="重置当前图片" placement="bottom">
                        <el-button class="tool-btn" circle @click="resetImageToInitial"
                            :disabled="isCurrentSaved || images.length === 0">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                        </el-button>
                    </el-tooltip>

                    <el-tooltip content="复位视图" placement="bottom">
                        <el-button class="tool-btn" circle @click="resetView">
                            <el-icon>
                                <Aim />
                            </el-icon>
                        </el-button>
                    </el-tooltip>

                    <el-tooltip :content="selectionMode === 'tight' ? '选中框：紧贴模式' : '选中框：正向模式'" placement="bottom">
                        <el-button class="tool-btn" circle @click="toggleSelectionMode">
                            <el-icon>
                                <Connection v-if="selectionMode === 'tight'" />
                                <FullScreen v-else />
                            </el-icon>
                        </el-button>
                    </el-tooltip>

                    <div class="undo-redo-group">
                        <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
                            <el-button class="tool-btn" circle @click="performUndo"
                                :disabled="isCurrentSaved || !images[currentImageIndex]?.undoStack?.length">
                                <el-icon>
                                    <RefreshLeft />
                                </el-icon>
                            </el-button>
                        </el-tooltip>
                        <el-tooltip content="重做 (Ctrl+Shift+Z)" placement="bottom">
                            <el-button class="tool-btn" circle @click="performRedo"
                                :disabled="isCurrentSaved || !images[currentImageIndex]?.redoStack?.length">
                                <el-icon>
                                    <RefreshRight />
                                </el-icon>
                            </el-button>
                        </el-tooltip>
                    </div>

                    <div class="divider-vertical"></div>

                    <el-tooltip content="下载数据" placement="bottom">
                        <el-button class="tool-btn" circle @click="openDownloadDialog('current')"
                            :disabled="images.length === 0">
                            <el-icon>
                                <Download />
                            </el-icon>
                        </el-button>
                    </el-tooltip>

                    <el-button class="tool-btn" :type="addMode ? 'primary' : 'default'" @click="toggleAddMode"
                        :disabled="images.length === 0 || isCurrentSaved" round>
                        <el-icon>
                            <Plus />
                        </el-icon>
                        <span class="responsive-text">{{ addMode ? '完成' : '绘制' }}</span>
                    </el-button>

                    <el-button class="tool-btn" type="danger" plain :disabled="!selectedBox || isCurrentSaved"
                        @click="deleteSelectedBox" round>
                        <el-icon>
                            <Delete />
                        </el-icon>
                        <span class="responsive-text">删除</span>
                    </el-button>
                </div>

                <!-- 紧凑工具栏 (Popover) -->
                <div class="right-panel compact-panel" v-else>
                    <el-popover placement="bottom-end" trigger="click" width="auto" popper-class="tools-popover">
                        <template #reference>
                            <el-button class="tool-btn" circle>
                                <el-icon>
                                    <Menu />
                                </el-icon>
                            </el-button>
                        </template>

                        <div class="compact-tools-grid">
                            <div class="tool-row">
                                <el-button class="tool-btn" :type="addMode ? 'primary' : 'default'"
                                    @click="toggleAddMode" :disabled="images.length === 0 || isCurrentSaved" round
                                    size="small">
                                    <el-icon>
                                        <Plus />
                                    </el-icon> {{ addMode ? '完成' : '绘制' }}
                                </el-button>
                                <el-button class="tool-btn" type="danger" plain
                                    :disabled="!selectedBox || isCurrentSaved" @click="deleteSelectedBox" round
                                    size="small">
                                    <el-icon>
                                        <Delete />
                                    </el-icon> 删除
                                </el-button>
                            </div>
                            <div class="divider-horizontal"></div>
                            <div class="tool-row icons-row">
                                <el-tooltip content="撤销" placement="top">
                                    <el-button class="tool-btn" circle size="small" @click="performUndo"
                                        :disabled="isCurrentSaved || !images[currentImageIndex]?.undoStack?.length">
                                        <el-icon>
                                            <RefreshLeft />
                                        </el-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip content="重做" placement="top">
                                    <el-button class="tool-btn" circle size="small" @click="performRedo"
                                        :disabled="isCurrentSaved || !images[currentImageIndex]?.redoStack?.length">
                                        <el-icon>
                                            <RefreshRight />
                                        </el-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip :content="selectionMode === 'tight' ? '选中框：紧贴' : '选中框：正向'" placement="top">
                                    <el-button class="tool-btn" circle size="small" @click="toggleSelectionMode">
                                        <el-icon>
                                            <Connection v-if="selectionMode === 'tight'" />
                                            <FullScreen v-else />
                                        </el-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip content="重置" placement="top">
                                    <el-button class="tool-btn" circle size="small" @click="resetImageToInitial"
                                        :disabled="isCurrentSaved || images.length === 0">
                                        <el-icon>
                                            <Refresh />
                                        </el-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip content="复位" placement="top">
                                    <el-button class="tool-btn" circle size="small" @click="resetView">
                                        <el-icon>
                                            <Aim />
                                        </el-icon>
                                    </el-button>
                                </el-tooltip>
                                <el-tooltip content="下载" placement="top">
                                    <el-button class="tool-btn" circle size="small"
                                        @click="openDownloadDialog('current')" :disabled="images.length === 0">
                                        <el-icon>
                                            <Download />
                                        </el-icon>
                                    </el-button>
                                </el-tooltip>
                            </div>
                        </div>
                    </el-popover>
                </div>
            </div>

            <!-- Fabric.js Canvas -->
            <canvas ref="canvasRef" id="annotatorCanvas"></canvas>

            <!-- 底部信息条 -->
            <div class="floating-toolbar bottom-bar">
                <div class="glass-pill image-pill">
                    <div class="pill-content">
                        <el-icon class="pill-icon">
                            <Picture />
                        </el-icon>
                        <span class="pill-text">{{ images[currentImageIndex]?.name || 'Unknown' }}</span>
                    </div>
                </div>

                <div class="glass-pill pagination-pill" v-if="images.length > 1">
                    <el-button-group>
                        <el-button size="small" type="text" @click="prevImage"
                            :disabled="currentImageIndex === 0 || isImageSwitching">
                            <el-icon>
                                <ArrowLeft />
                            </el-icon> 上一张
                        </el-button>
                        <span class="page-counter">{{ currentImageIndex + 1 }} / {{ images.length }}</span>
                        <el-button size="small" type="text" @click="nextImage"
                            :disabled="currentImageIndex === images.length - 1 || isImageSwitching">
                            下一张 <el-icon>
                                <ArrowRight />
                            </el-icon>
                        </el-button>
                    </el-button-group>
                </div>
            </div>
        </div>

        <!-- 右侧边栏 -->
        <div class="right-sidebar">
            <div class="sidebar-header">
                <!-- 修复 $t -->
                <span>{{ t('label.imageAnnotation.annotationSettings') }}</span>
            </div>

            <div class="sidebar-content">

                <div class="top-section">
                    <div class="input-group">
                        <!-- 修复 $t -->
                        <div class="input-label">{{ t('label.imageAnnotation.annotationName') }}</div>
                        <el-input v-model="annotationName" maxlength="30" disabled size="default" />
                    </div>
                </div>

                <div class="main-layout-wrapper">

                    <div class="tools-section">
                        <div class="input-group">
                            <div class="input-label">Rect Label</div>
                            <el-select v-model="currentLabel" placeholder="选择或输入标签" filterable allow-create clearable
                                size="default" style="width: 100%" @change="handleLabelChange">
                                <el-option v-for="label in labelList" :key="label" :label="label" :value="label" />
                            </el-select>
                        </div>

                        <el-divider content-position="left">当前选中</el-divider>

                        <div class="current-edit-area">
                            <div v-if="selectedBox" class="edit-row">
                                <el-select v-model="selectedLabelEdit" :disabled="isCurrentSaved" placeholder="选择或输入标签"
                                    filterable allow-create clearable default-first-option size="default"
                                    style="flex: 1;">
                                    <el-option v-for="label in labelList" :key="label" :label="label" :value="label" />
                                </el-select>

                                <el-button type="primary" plain size="default" @click="applyLabelToSelected"
                                    :disabled="!selectedLabelEdit || isCurrentSaved" style="margin-left: 8px;">
                                    应用
                                </el-button>
                            </div>
                            <div v-else class="empty-state">
                                点击画布中的矩形框进行编辑
                            </div>
                        </div>

                        <el-divider content-position="left">
                            矩形框列表 ({{ sortedBoxes.length }} / {{ boxes.length }})
                        </el-divider>

                        <div class="filter-container" v-if="currentImageLabels.length >= 2" ref="filterContainerRef"
                            @wheel="handleFilterWheel">
                            <div class="filter-tag" :class="{ active: activeLabelFilter === '' }"
                                @click="toggleLabelFilter('')">
                                全部
                            </div>
                            <div v-for="label in currentImageLabels" :key="label" class="filter-tag"
                                :class="{ active: activeLabelFilter === label }"
                                :style="activeLabelFilter === label ? { backgroundColor: colorForId(label), borderColor: colorForId(label), color: '#fff' } : { color: colorForId(label), borderColor: colorForId(label) }"
                                @click="toggleLabelFilter(label)">
                                {{ label }}
                            </div>
                        </div>
                    </div>

                    <div class="box-list" ref="listContainerRef">
                        <ul>
                            <li v-for="box in sortedBoxes" :key="box.id" :id="'box-item-' + box.object_id"
                                class="box-list-item" :style="getListItemStyle(box)" @click="selectBoxFromList(box)">
                                <div class="item-header">
                                    <span class="item-label" :style="{ color: box.color }">{{ box.label }}</span>
                                    <span class="item-type-tag">{{ box.originalPoints ? 'OBB' : 'Rect' }}</span>
                                </div>
                                <div class="item-coords">
                                    <template v-if="box.originalPoints">
                                        <div class="coord-row" v-for="(p, i) in box.originalPoints" :key="i">
                                            P{{ i + 1 }}: [{{ Math.round(p.x) }}, {{ Math.round(p.y) }}]
                                        </div>
                                    </template>
                                    <template v-else-if="box.angle && box.angle !== 0">
                                        <div class="coord-row">Rotated Rect</div>
                                        <div class="coord-row">Center: [{{ Math.round(box.x + box.w / 2) }}, {{
                                            Math.round(box.y + box.h / 2) }}]</div>
                                    </template>
                                    <template v-else>
                                        <div class="coord-row">Start: [{{ Math.round(box.x) }}, {{ Math.round(box.y) }}]
                                        </div>
                                        <div class="coord-row">End: [{{ Math.round(box.x + box.w) }}, {{
                                            Math.round(box.y + box.h) }}]</div>
                                        <div class="coord-row">Size: {{ Math.round(box.w) }} × {{ Math.round(box.h) }}
                                        </div>
                                    </template>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="sidebar-footer">
                <el-button type="success" @click="save" class="save-btn" :disabled="isLoading || isCurrentSaved">
                    {{ isCurrentSaved ? '已保存' : '保存标注' }}
                </el-button>
            </div>
        </div>

        <!-- 下载弹窗 -->
        <el-dialog v-model="downloadDialogVisible" title="导出设置" width="460px" align-center :close-on-click-modal="false"
            class="custom-export-dialog" destroy-on-close>
            <div class="download-dialog-content">
                <div class="format-label">请选择导出格式</div>
                <div class="format-selection">
                    <div class="format-option" :class="{ active: selectedTransformType === 'YOLO' }"
                        @click="selectedTransformType = 'YOLO'">
                        <div class="icon-box">Y</div>
                        <div class="text-box">
                            <span class="name">YOLO</span>
                            <span class="desc">适用于目标检测 (.txt/.json)</span>
                        </div>
                        <el-icon class="check-mark" v-if="selectedTransformType === 'YOLO'">
                            <Check />
                        </el-icon>
                    </div>

                    <div class="format-option" :class="{ active: selectedTransformType === 'COCO' }"
                        @click="selectedTransformType = 'COCO'">
                        <div class="icon-box" style="background: #67C23A;">C</div>
                        <div class="text-box">
                            <span class="name">COCO</span>
                            <span class="desc">通用数据集格式 (.json)</span>
                        </div>
                        <el-icon class="check-mark" v-if="selectedTransformType === 'COCO'">
                            <Check />
                        </el-icon>
                    </div>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="downloadDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="executeDownload" :loading="false">
                        确定导出
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 快捷键指南弹窗 (保持原样，因为 kbd 标签不影响) -->
        <el-dialog v-model="shortcutDialogVisible" title="快捷键指南" width="640px" align-center class="shortcut-dialog"
            :close-on-click-modal="true">
            <div class="shortcut-grid">
                <div class="shortcut-group">
                    <div class="group-title">通用编辑</div>
                    <div class="key-row">
                        <span class="key-desc">撤销 / 重做</span>
                        <div class="key-combine">
                            <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Y</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">复制 / 粘贴</span>
                        <div class="key-combine">
                            <kbd>Ctrl</kbd> + <kbd>C</kbd> / <kbd>V</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">删除选中</span>
                        <div class="key-combine">
                            <kbd>Del</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">多选对象</span>
                        <div class="key-combine">
                            <kbd>Shift</kbd> + <kbd>左键</kbd>
                        </div>
                    </div>
                </div>

                <div class="shortcut-group">
                    <div class="group-title">视图与移动</div>
                    <div class="key-row">
                        <span class="key-desc">缩放视图</span>
                        <div class="key-combine">
                            <kbd>Ctrl</kbd> + <kbd>滚轮</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">平移画布</span>
                        <div class="key-combine">
                            <kbd>Alt</kbd> + <kbd>左/右键</kbd> / <kbd>中键</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">移动对象 (1px)</span>
                        <div class="key-combine">
                            <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">快速移动 (10px)</span>
                        <div class="key-combine">
                            <kbd>Shift</kbd> + <kbd>Arrows</kbd>
                        </div>
                    </div>
                </div>

                <div class="shortcut-group">
                    <div class="group-title">对象变换</div>

                    <div class="key-row">
                        <span class="key-desc">旋转 (顺/逆)</span>
                        <div class="key-combine">
                            <kbd>R</kbd> / <kbd>E</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">精细旋转 (1°)</span>
                        <div class="key-combine">
                            <kbd>Shift</kbd> + <kbd>R</kbd> / <kbd>E</kbd>
                        </div>
                    </div>

                    <div class="divider-line"></div>

                    <div class="key-row">
                        <span class="key-desc">整体缩放</span>
                        <div class="key-combine">
                            <kbd>+</kbd> / <kbd>-</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">精细缩放 (1%)</span>
                        <div class="key-combine">
                            <kbd>Shift</kbd> + <kbd>+</kbd> / <kbd>-</kbd>
                        </div>
                    </div>

                    <div class="divider-line"></div>

                    <div class="key-row">
                        <span class="key-desc">调整宽 / 高</span>
                        <div class="key-combine">
                            <kbd>W</kbd> <kbd>Q</kbd> / <kbd>S</kbd> <kbd>A</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">精细 / 快速调整</span>
                        <div class="key-combine">
                            <kbd>Shift</kbd> + <kbd>Key</kbd>
                        </div>
                    </div>
                </div>

                <div class="shortcut-group">
                    <div class="group-title">系统与帮助</div>
                    <div class="key-row">
                        <span class="key-desc">打开快捷键指南</span>
                        <div class="key-combine">
                            <kbd>h</kbd> / <kbd>H</kbd> / <kbd>?</kbd>
                        </div>
                    </div>
                    <div class="key-row">
                        <span class="key-desc">关闭弹窗 / 取消</span>
                        <div class="key-combine">
                            <kbd>Esc</kbd>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>


<script lang="ts" setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import {
    Menu,
    Edit,
    Check,
    Picture,
    Download,
    Delete,
    CaretLeft,
    CaretRight,
    Back,
    Refresh,
    Aim,
    Connection,
    FullScreen,
    RefreshLeft,
    RefreshRight,
    Plus,
    ArrowLeft,
    ArrowRight
} from '@element-plus/icons-vue';
import { ElMessage } from "element-plus";
import * as fabric from "fabric";

// 定义 Props 接收外部数据
const props = defineProps({
    // 传入图片列表数据
    imageList: {
        type: Array as any,
        default: () => []
    },
    // 传入候选标签
    labels: {
        type: Array as any,
        default: () => ['Car', 'Person', 'Shoes', 'Tree']
    }
});

// 定义 Emits 输出结果
const emit = defineEmits(["back", "save"]);

// Mock i18n 和 UserStore
const t = (key: string) => {
    const map: Record<string, string> = {
        'label.imageAnnotation.segment.trainingName': '任务名称',
        'label.imageAnnotation.annotationSettings': '标注设置',
        'label.imageAnnotation.annotationName': '数据集名称'
    };
    return map[key] || key;
};
const userStore = { userInfo: { uid: 999, username: 'DemoUser' } }; // Mock user

// --- reactive state ---
const isLoading = ref(false);
const annotationName = ref(props.annotationName);
// Global Label 状态
const globalLabel = ref("");
// 响应式布局控制
const isCompactMode = ref(false);
const imageAnnotationId = ref(props.id);
const trainingName = ref(props.trainingRoom);

// images: an array of { id, url, res: [...] } where res is array of annotation objects
const images = ref<Array<any>>([]);
const currentImageIndex = ref(0);
const canvasRef = ref<HTMLCanvasElement | null>(null);
// 容器引用
const canvasContainerRef = ref<HTMLDivElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
let canvas: fabric.Canvas | null = null;
// Viewport / Panning state (平移状态变量)
let isDragging = false;
let lastPosX = 0;
let lastPosY = 0;
// annotation related
const addMode = ref(false);
const drawing = ref(false);
// 标记是否正在选中（避免触发同步）
const isSelecting = ref(false);
const startPoint = reactive({
    x: 0,
    y: 0,
});
const tempRect: {
    rect?: fabric.Rect;
} = reactive({});
// flattened list for UI listing (synchronized with fabric objects)
const boxes = ref<Array<any>>([]);
const labelList = ref<Array<string>>([]);
const currentLabel = ref<string>("");
// 处理 Label 输入变更，自动去除首尾空格
const handleLabelChange = (val: string) => {
    if (!val) return;
    // 如果输入的是纯空格，trim() 后为空字符串
    const trimmed = val.trim();

    // 如果修剪后的值与原值不同（说明有空格），或者修剪后为空
    if (trimmed !== val) {
        currentLabel.value = trimmed; // 强制更新绑定的值
    }

    // 如果修剪后为空字符串，说明用户只输入了空格，将其置空，防止产生空选项
    if (!trimmed) {
        currentLabel.value = "";
    }
};
// holds { id, object_id, label, color, x,y,w,h,angle }
const selectedBox = ref<any>(null);
const selectedLabelEdit = ref<string>("");
// 当前激活的筛选 Label，空字符串表示显示全部
const activeLabelFilter = ref('');
// 引用筛选容器
const filterContainerRef = ref<HTMLElement | null>(null);
// 引用右侧列表容器
const listContainerRef = ref<HTMLElement | null>(null);
// 图片切换状态锁
const isImageSwitching = ref(false);

// 撤销功能状态
// 存储历史记录栈
const undoStack = ref<Array<any[]>>([]);
// 用于记录拖拽/修改前的状态
const dragStartState = ref<any[] | null>(null);

// 左侧列表相关状态
// 默认折叠
const isLeftSidebarExpanded = ref(false);
// all, annotated, in_progress
const activeImageFilter = ref('all');

// 多选相关状态
const selectedImageIds = ref(new Set<number | string>());
// 记录最后一次点击的图片ID，用于 Shift 连选
const lastSelectedId = ref<number | string | null>(null);

// 下载相关状态和逻辑
const downloadDialogVisible = ref(false);
const selectedTransformType = ref("YOLO");
const pendingDownloadAction = ref<"batch" | "current" | null>(null);
// 默认为紧贴模式
const selectionMode = ref<'tight' | 'axis'>('tight');
const shortcutDialogVisible = ref(false);

// 切换模式函数
const toggleSelectionMode = () => {
    // 切换状态
    selectionMode.value = selectionMode.value === 'tight' ? 'axis' : 'tight';

    // 提示用户
    if (selectionMode.value === 'tight') {
        ElMessage.success('切换为：紧贴模式 (Tight)');
    } else {
        ElMessage.success('切换为：正向模式 (Axis-Aligned)');
    }
};

// 监听器 (确保这个 watch 存在，用于驱动视图刷新)
watch(selectionMode, () => {
    const currentImage = images.value[currentImageIndex.value];
    if (currentImage && currentImage.res) {
        // 使用现有的 reloadCanvasData 刷新视图
        reloadCanvasData(currentImage.res);
    }
});

const getTightPolygonParams = (originalPoints: { x: number, y: number }[]) => {
    if (!originalPoints || originalPoints.length < 2) return null;

    const p0 = originalPoints[0];
    const p1 = originalPoints[1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const rad = -angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const unrotatedPoints = originalPoints.map(p => ({
        x: p.x * cos - p.y * sin,
        y: p.x * sin + p.y * cos
    }));

    const xs = unrotatedPoints.map(p => p.x);
    const ys = unrotatedPoints.map(p => p.y);
    const uCx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const uCy = (Math.min(...ys) + Math.max(...ys)) / 2;

    const relativePoints = unrotatedPoints.map(p => ({
        x: p.x - uCx,
        y: p.y - uCy
    }));

    const radBack = angle * Math.PI / 180;
    const cosB = Math.cos(radBack);
    const sinB = Math.sin(radBack);

    const centerX = uCx * cosB - uCy * sinB;
    const centerY = uCx * sinB + uCy * cosB;

    return {
        angle,
        relativePoints,
        centerX,
        centerY
    };
};

const openDownloadDialog = (action: "batch" | "current") => {
    if (action === "batch" && selectedImageIds.value.size === 0) return;

    pendingDownloadAction.value = action;
    selectedTransformType.value = "YOLO";
    downloadDialogVisible.value = true;
};

const checkWindowSize = () => {
    isCompactMode.value = window.innerWidth <= 1625;
};

const loadImageSize = (url: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = (e) => {
            console.warn("获取图片尺寸失败:", url);
            resolve({ width: 0, height: 0 });
        };

        img.src = url;
    });
};

const executeDownload = async () => {
    isLoading.value = true;

    downloadDialogVisible.value = false;

    let targetImages: any[] = [];

    if (pendingDownloadAction.value === "current") {
        saveCurrentBoxesToImages();
        const currentImg = images.value[currentImageIndex.value];
        if (currentImg) targetImages = [currentImg];
    } else if (pendingDownloadAction.value === "batch") {
        targetImages = images.value.filter(img => selectedImageIds.value.has(img.id));
    }

    if (targetImages.length === 0) {
        ElMessage.warning("没有可下载的数据");
        return;
    }

    try {
        await Promise.all(targetImages.map(async (img) => {
            if (img.realIndex === currentImageIndex.value && canvas && canvas.backgroundImage) {
                const bg = canvas.backgroundImage as any;
                img.width = bg.width;
                img.height = bg.height;
            }
            else if (!img.width || !img.height || img.width === 0) {
                const size = await loadImageSize(img.url);
                img.width = size.width;
                img.height = size.height;
            }
        }));

        const payload = generatePayload(targetImages);

        ImageAnnotationDownload(payload)
            .then((res) => {
                if (res) {
                    ElMessage.success(`导出成功，开始下载...`);
                    downloadFileFromUrl(res);
                } else {
                    ElMessage.error("导出过程中发生错误");
                }
            })
            .catch((err) => {
                ElMessage.error("导出失败：未获取到下载链接");
                console.error("Download Error:", err);
            }).finally(() => {
                isLoading.value = false;
            })
    } catch (error) {
        console.error("Download Error:", error);
        isLoading.value = false;
        ElMessage.error("导出过程中发生错误");
    }
};

const downloadFileFromUrl = (url: string, filename?: string) => {
    const link = document.createElement("a");
    link.href = url;

    if (filename) {
        link.download = filename;
    } else {
        link.setAttribute('download', '');
    }

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
};

const getGeometricPoints = (obj: any) => {
    const center = obj.getCenterPoint();
    const cx = center.x;
    const cy = center.y;

    const w = obj.width * (obj.scaleX || 1);
    const h = obj.height * (obj.scaleY || 1);

    const angle = (obj.angle || 0) * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const hw = w / 2;
    const hh = h / 2;
    const corners = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
    ];

    return corners.map(p => {
        return [
            Math.round(cx + (p.x * cos - p.y * sin)),
            Math.round(cy + (p.x * sin + p.y * cos))
        ];
    });
};

const buildGlobalLabelMap = () => {
    const labelIdMap = new Map<string, number>();
    let maxId = 0;

    images.value.forEach(img => {
        if (Array.isArray(img.res)) {
            img.res.forEach((item: any) => {
                const rawIdStr = String(item.object_id).split('_')[0];
                const dbId = parseInt(rawIdStr, 10);
                const label = item.label;

                if (!isNaN(dbId) && label) {
                    if (!labelIdMap.has(label)) {
                        labelIdMap.set(label, dbId);
                    }
                    if (dbId > maxId) maxId = dbId;
                }
            });
        }
    });

    if (canvas) {
        const canvasObjects = canvas.getObjects().filter((o: any) => o.isAnnot);
        const currentLabels = new Set(canvasObjects.map((o: any) => o.label));
        const newLabels: string[] = [];

        currentLabels.forEach(label => {
            if (label && !labelIdMap.has(label)) {
                newLabels.push(label);
            }
        });

        newLabels.sort((a, b) => a.localeCompare(b));
        newLabels.forEach(label => {
            maxId++;
            labelIdMap.set(label, maxId);
        });
    }

    return labelIdMap;
};

const generatePayload = (imageList: any[]) => {
    const labelIdMap = buildGlobalLabelMap();

    const contentObj: Record<string, any> = {};

    imageList.forEach(img => {
        const width = img.width || 0;
        const height = img.height || 0;

        let annotationData: any[] = [];

        const isCurrentAndLoaded = img.realIndex === currentImageIndex.value && canvas && canvas.backgroundImage;

        if (isCurrentAndLoaded) {
            const validObjects = canvas.getObjects().filter((o: any) => o.isAnnot);

            annotationData = validObjects.map((o: any) => {
                let points: number[][] = [];
                if (o.setCoords) o.setCoords();

                const isRotated = o.angle && (Math.abs(o.angle) % 360 > 0.01);

                if (o.type === 'polygon' && o.originalPoints) {
                    points = o.originalPoints.map((p: any) => [Math.round(p.x), Math.round(p.y)]);
                } else {
                    if (isRotated) {
                        points = getGeometricPoints(o);
                    } else {
                        let x = o.left;
                        let y = o.top;
                        if (o.originX === "center") x = o.left - (o.width * (o.scaleX || 1)) / 2;
                        if (o.originY === "center") y = o.top - (o.height * (o.scaleY || 1)) / 2;

                        const finalX = Math.round(x);
                        const finalY = Math.round(y);
                        const finalW = Math.round(o.width * (o.scaleX || 1));
                        const finalH = Math.round(o.height * (o.scaleY || 1));

                        points = [
                            [finalX, finalY],
                            [finalX + finalW, finalY + finalH]
                        ];
                    }
                }

                const logicalId = labelIdMap.get(o.label) || 0;

                return {
                    object_name: o.label || "unknown",
                    object_id: String(logicalId),
                    bbox: [points],
                    label: globalLabel.value ? [globalLabel.value] : [""]
                };
            });

        } else {
            const res = img.res || [];

            annotationData = res.map((item: any) => {
                let bboxPoints: number[][] = [];

                if (item.type === 'obb' && item.originalPoints) {
                    bboxPoints = item.originalPoints.map((p: any) => [Math.round(Number(p.x)), Math.round(Number(p.y))]);
                } else {
                    const x1 = Math.round(Number(item.x));
                    const y1 = Math.round(Number(item.y));
                    const x2 = Math.round(Number(item.x) + Number(item.width));
                    const y2 = Math.round(Number(item.y) + Number(item.height));
                    bboxPoints = [
                        [x1, y1],
                        [x2, y2]
                    ];
                }

                let finalId = "";
                if (item.label && labelIdMap.has(item.label)) {
                    finalId = String(labelIdMap.get(item.label));
                } else {
                    finalId = String(item.object_id).split('_')[0];
                }

                return {
                    object_name: item.label || "unknown",
                    object_id: finalId,
                    bbox: [bboxPoints],
                    label: globalLabel.value ? [globalLabel.value] : [""]
                };
            });
        }

        annotationData.sort((a, b) => {
            const idA = parseInt(a.object_id, 10);
            const idB = parseInt(b.object_id, 10);

            if (isNaN(idA)) return 1;
            if (isNaN(idB)) return -1;

            return idA - idB;
        });

        contentObj[img.name] = {
            image_size: [width, height],
            annotation: annotationData
        };
    });

    return {
        annotation_set_name: annotationName.value || "Unnamed Set",
        transform_type: selectedTransformType.value,
        content: contentObj
    };
};

const filteredImageList = computed(() => {
    let list = images.value.map((img, index) => ({
        ...img,
        realIndex: index
    }));

    if (activeImageFilter.value === 'annotated') {
        list = list.filter(img => img.isSaved === true);
    } else if (activeImageFilter.value === 'in_progress') {
        list = list.filter(img => !img.isSaved);
    }

    list.sort((a, b) => {
        const idA = parseInt(String(a.id || 0));
        const idB = parseInt(String(b.id || 0));
        return idA - idB;
    });

    return list;
});

const isAllInViewSelected = computed(() => {
    if (filteredImageList.value.length === 0) return false;
    return filteredImageList.value.every(img => selectedImageIds.value.has(img.id));
});

const isIndeterminate = computed(() => {
    if (filteredImageList.value.length === 0) return false;
    const selectedCountInView = filteredImageList.value.filter(img => selectedImageIds.value.has(img.id)).length;
    return selectedCountInView > 0 && selectedCountInView < filteredImageList.value.length;
});

const handleSelectAllChange = (val: boolean) => {
    const newSet = new Set(selectedImageIds.value);

    filteredImageList.value.forEach(img => {
        if (val) {
            newSet.add(img.id);
        } else {
            newSet.delete(img.id);
        }
    });

    selectedImageIds.value = newSet;

    lastSelectedId.value = null;
};

const clearSelectionInView = () => {
    const newSet = new Set(selectedImageIds.value);

    filteredImageList.value.forEach(img => {
        newSet.delete(img.id);
    });

    selectedImageIds.value = newSet;
    lastSelectedId.value = null;
};

const toggleImageSelection = (img: any, event: MouseEvent) => {
    const id = img.id;
    const list = filteredImageList.value;
    const newSet = new Set(selectedImageIds.value);

    if (event.shiftKey && lastSelectedId.value !== null) {
        const currentIndex = list.findIndex(item => item.id === id);
        const lastIndex = list.findIndex(item => item.id === lastSelectedId.value);

        if (currentIndex !== -1 && lastIndex !== -1) {
            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);
            for (let i = start; i <= end; i++) {
                newSet.add(list[i].id);
            }
        }
    } else {
        if (newSet.has(id)) {
            newSet.delete(id);
            lastSelectedId.value = null;
        } else {
            newSet.add(id);
            lastSelectedId.value = id;
        }
    }
    selectedImageIds.value = newSet;
};

const jumpToImage = (targetIndex: number) => {
    if (currentImageIndex.value === targetIndex || isImageSwitching.value) {
        return;
    }

    saveCurrentBoxesToImages();

    currentImageIndex.value = targetIndex;

    selectedBox.value = null;
    selectedLabelEdit.value = "";

    loadCurrentImage();
};

onMounted(() => {
    checkWindowSize();
    window.addEventListener('resize', checkWindowSize);
    init()
});

watch(
    () => props.trainingRoom,
    (val) => (trainingName.value = val),
);

watch(
    () => props.annotationName,
    (val) => (annotationName.value = val),
);

watch(
    () => props.id,
    (val) => (imageAnnotationId.value = val),
);

onBeforeUnmount(() => {
    window.removeEventListener('resize', checkWindowSize);
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }

    if (canvas) {
        canvas.dispose();
        canvas = null;
    }
});

const sortedBoxes = computed(() => {
    let result = [...boxes.value];

    if (activeLabelFilter.value) {
        result = result.filter(b => b.label === activeLabelFilter.value);
    }

    return result.sort((a, b) => {
        const labelA = a.label || "";
        const labelB = b.label || "";
        return labelA.localeCompare(labelB);
    });
});

const isCurrentSaved = computed(() => {
    const img = images.value[currentImageIndex.value];
    return img ? !!img.isSaved : false;
});

const currentImageLabels = computed(() => {
    const labels = new Set(boxes.value.map(b => b.label).filter(l => l));
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
});

const scrollToBox = (boxId: string) => {
    nextTick(() => {
        const element = document.getElementById(`box-item-${boxId}`);

        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    });
};

const toggleLabelFilter = (label: string) => {
    if (activeLabelFilter.value === label) {
        activeLabelFilter.value = '';
    } else {
        activeLabelFilter.value = label;
    }

    if (selectedBox.value && selectedBox.value.object_id) {
        if (activeLabelFilter.value === '' || selectedBox.value.label === activeLabelFilter.value) {
            scrollToBox(selectedBox.value.object_id);
        }
    }
};

const handleFilterWheel = (e: WheelEvent) => {
    const container = filterContainerRef.value;
    if (!container) return;

    if (container.scrollWidth <= container.clientWidth) return;

    container.scrollLeft += e.deltaY;

    e.preventDefault();
};

const getGroupTargetId = () => {
    const group = selectedBox.value;
    if (!group || !group.isGroup || !Array.isArray(group.objects) || group.objects.length === 0) {
        return null;
    }

    const visibleObjs = sortedBoxes.value.filter(item => group.objects.includes(item.object_id));

    if (visibleObjs.length === 0) return null;

    if (activeLabelFilter.value) {
        return visibleObjs[0].object_id;
    }

    const labels = visibleObjs.map(o => o.label);
    labels.sort();
    const targetLabel = labels[labels.length - 1];

    for (let i = group.objects.length - 1; i >= 0; i--) {
        const id = group.objects[i];
        const match = visibleObjs.find(o => o.object_id === id);
        if (match && match.label === targetLabel) {
            return id;
        }
    }

    return visibleObjs[0].object_id;
};

watch(currentImageIndex, () => {
    activeLabelFilter.value = '';

    if (listContainerRef.value) {
        listContainerRef.value.scrollTop = 0;
    }
});

watch(activeLabelFilter, () => {
    if (listContainerRef.value) {
        listContainerRef.value.scrollTop = 0;
    }

    nextTick(() => {
        if (!selectedBox.value) return;

        let targetId = null;

        if (selectedBox.value.object_id) {
            const isVisible = sortedBoxes.value.some(o => o.object_id === selectedBox.value.object_id);
            if (isVisible) targetId = selectedBox.value.object_id;
        }
        else if (selectedBox.value.isGroup) {
            targetId = getGroupTargetId();
        }

        if (targetId) {
            scrollToBox(targetId);
        }
    });
});

watch(
    () => selectedBox.value,
    (newVal) => {
        if (!newVal) return;

        nextTick(() => {
            let targetId = null;

            if (newVal.object_id) {
                targetId = newVal.object_id;
            }
            else if (newVal.isGroup) {
                targetId = getGroupTargetId();
            }

            if (targetId) {
                scrollToBox(targetId);
            }
        });
    }
);

watch(isLeftSidebarExpanded, () => {
    if (!canvas) return;

    setTimeout(() => {
        resizeCanvasToContainer();
    }, 310);
});

const init = () => {
    isLoading.value = true;

    try {
        const res = props.imageList;

        if (!Array.isArray(res)) {
            console.warn("No image list provided in props.");
            isLoading.value = false;
            return;
        }

        images.value = res.map((item: any) => {
            const { id, originalUrl, originalName, segmentResults, isSaved } = item;
            const resList: any[] = [];

            if (Array.isArray(segmentResults)) {
                segmentResults.forEach((seg: any, idx: number) => {
                    const { axisAlignedBbox, orientedBbox, objectName, objectId, rectId } = seg;

                    const label = objectName || "unknown";
                    const baseId = String(objectId ?? `temp_${idx}`);

                    // --- AABB 处理 ---
                    if (axisAlignedBbox) {
                        try {
                            const aabb = JSON.parse(axisAlignedBbox);

                            if (Array.isArray(aabb) && aabb.length === 2) {
                                const x = aabb[0][0];
                                const y = aabb[0][1];
                                const width = aabb[1][0] - aabb[0][0];
                                const height = aabb[1][1] - aabb[0][1];

                                resList.push({
                                    type: "aabb",
                                    x,
                                    y,
                                    width,
                                    height,
                                    angle: 0,
                                    object_id: rectId ? rectId : `${baseId}_aabb`,
                                    label: label,
                                    color: colorForId(label),
                                });
                            }
                        } catch (e) {
                            console.warn("Invalid axisAlignedBbox:", axisAlignedBbox);
                        }
                    }

                    // --- OBB 处理 ---
                    if (orientedBbox) {
                        try {
                            const obb = JSON.parse(orientedBbox);

                            if (Array.isArray(obb) && obb.length === 4) {
                                const originalPoints = obb.map((p: any) => ({
                                    x: parseFloat(p[0]),
                                    y: parseFloat(p[1])
                                }));

                                const minX = Math.min(...originalPoints.map((p: any) => p.x));
                                const minY = Math.min(...originalPoints.map((p: any) => p.y));
                                const maxX = Math.max(...originalPoints.map((p: any) => p.x));
                                const maxY = Math.max(...originalPoints.map((p: any) => p.y));

                                const dx = originalPoints[1].x - originalPoints[0].x;
                                const dy = originalPoints[1].y - originalPoints[0].y;
                                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

                                resList.push({
                                    type: "obb",
                                    x: minX,
                                    y: minY,
                                    width: maxX - minX,
                                    height: maxY - minY,
                                    angle: angle,
                                    object_id: rectId ? rectId : `${baseId}_obb`,
                                    label: label,
                                    color: colorForId(label),
                                    originalPoints: originalPoints,
                                });
                            }
                        } catch (e) {
                            console.warn("Invalid orientedBbox:", orientedBbox);
                        }
                    }
                });
            }

            const initialRes = JSON.parse(JSON.stringify(resList));

            return {
                id,
                url: originalUrl,
                name: originalName,
                isSaved: isSaved,
                res: resList,
                initialRes: initialRes,
                undoStack: [],
                redoStack: []
            };
        });

        const labels = new Set<string>(props.labels || []);

        images.value.forEach((img) =>
            img.res.forEach((r: any) => labels.add(r.label)),
        );

        labelList.value = Array.from(labels).sort();

        // --- 初始化画布 ---
        setupCanvas();
        loadCurrentImage();

    } catch (e) {
        console.error(e);
        ElMessage.error("Init Data Failed.");
    } finally {
        isLoading.value = false;
    }
};


// 历史记录同步函数 
function syncCanvasStateForHistory() {
    if (!canvas) return;

    // 防止切换期间运行
    if (isImageSwitching.value) return;

    const currentImage = images.value[currentImageIndex.value];
    if (!currentImage) return;

    // 获取所有标注对象
    const canvasObjects = canvas.getObjects().filter((o) => (o as any).isAnnot);

    currentImage.res = canvasObjects.map((obj: any) => {
        let result: any = {
            object_id: obj.object_id,
            label: obj.label,
            color: obj.color,
        };

        // 计算矩阵 
        const matrix = obj.calcTransformMatrix();
        const decomposed = fabric.util.qrDecompose(matrix);

        // 判断复杂形状
        const isComplexShape = obj.type === 'polygon' ||
            (Math.abs(decomposed.angle) > 0.01) ||
            (Math.abs(decomposed.skewX) > 0.01) ||
            (Math.abs(decomposed.skewY) > 0.01);

        if (isComplexShape) {
            result.type = 'obb';

            let pointsSource = obj.type === 'polygon' ? obj.get('points') : [
                { x: -obj.width / 2, y: -obj.height / 2 },
                { x: obj.width / 2, y: -obj.height / 2 },
                { x: obj.width / 2, y: obj.height / 2 },
                { x: -obj.width / 2, y: obj.height / 2 }
            ];

            const absolutePoints = pointsSource.map((p: any) => {
                const point = new fabric.Point(p.x, p.y);
                const transformed = fabric.util.transformPoint(point, matrix);
                return { x: transformed.x, y: transformed.y };
            });

            const xs = absolutePoints.map((p: any) => p.x);
            const ys = absolutePoints.map((p: any) => p.y);

            result.x = Math.min(...xs);
            result.y = Math.min(...ys);
            result.width = Math.max(...xs) - result.x;
            result.height = Math.max(...ys) - result.y;

            result.angle = 0;
            result.originalPoints = absolutePoints;
            result.scaleX = 1;
            result.scaleY = 1;
            result.skewX = 0;
            result.skewY = 0;

        } else {
            result.type = 'aabb';
            let rawX, rawY;

            if (typeof obj.originalX === 'number' && typeof obj.originalY === 'number') {
                rawX = obj.originalX;
                rawY = obj.originalY;
            } else {
                const absCenter = { x: decomposed.translateX, y: decomposed.translateY };
                const absWidth = obj.width * decomposed.scaleX;
                const absHeight = obj.height * decomposed.scaleY;
                rawX = absCenter.x - absWidth / 2;
                rawY = absCenter.y - absHeight / 2;
            }

            result.x = rawX;
            result.y = rawY;

            result.width = obj.width;
            result.height = obj.height;
            result.scaleX = decomposed.scaleX;
            result.scaleY = decomposed.scaleY;

            result.angle = 0;
            result.skewX = 0;
            result.skewY = 0;
            result.originalPoints = null;
        }

        return result;
    });
}

// 提交历史记录
const commitHistory = () => {
    const currentImage = images.value[currentImageIndex.value];
    if (!currentImage) return;

    // 调用不破坏选中状态的同步函数
    syncCanvasStateForHistory();

    // 深拷贝当前状态作为快照
    const snapshot = JSON.parse(JSON.stringify(currentImage.res || []));

    // 推入撤销栈
    currentImage.undoStack.push(snapshot);

    // 关键：一旦有新操作，重做栈必须清空，因为历史分支改变了
    currentImage.redoStack = [];

    // 限制栈大小
    if (currentImage.undoStack.length > 50) {
        currentImage.undoStack.shift();
    }
};

// 重新加载 Canvas 数据 
const reloadCanvasData = (resData: any[]) => {
    if (!canvas) return;

    // 记录当前选中的状态
    const previousSelection = selectedBox.value;

    clearCanvasAnnotations(); // 清理旧对象
    renderResBoxes(resData);  // 渲染新对象
    updateBoxesFromOriginalData(resData); // 更新 Vue 列表状态

    // 尝试恢复选中状态
    if (previousSelection) {
        if (previousSelection.isGroup && Array.isArray(previousSelection.objects) && previousSelection.objects.length > 0) {
            const targetIds = new Set(previousSelection.objects);

            // 在新渲染的对象中找到对应的
            const objectsToSelect = canvas.getObjects().filter((o: any) =>
                o.isAnnot && targetIds.has(o.object_id)
            );

            if (objectsToSelect.length > 0) {
                // 重新创建 ActiveSelection
                const activeSelection = new fabric.ActiveSelection(objectsToSelect, {
                    canvas: canvas,
                });
                canvas.setActiveObject(activeSelection);

                // 恢复 Vue 状态
                selectedBox.value = {
                    isGroup: true,
                    objects: objectsToSelect.map((o: any) => o.object_id)
                };
                selectedLabelEdit.value = ""; // 组选时不显示特定 Label
            }
        } else if (previousSelection.object_id) {
            const objToSelect = canvas.getObjects().find((o: any) => o.object_id === previousSelection.object_id);
            if (objToSelect) {
                canvas.setActiveObject(objToSelect);
                updateObjectRealtime(objToSelect); // 同步状态

                // 查找列表中的数据以保持一致性
                const boxInList = boxes.value.find(b => b.object_id === previousSelection.object_id);
                if (boxInList) {
                    selectedBox.value = { ...boxInList, fabricObj: objToSelect };
                    selectedLabelEdit.value = boxInList.label;
                }
            }
        }
    } else {
        selectedBox.value = null;
        selectedLabelEdit.value = "";
    }

    canvas.requestRenderAll();
};

// 执行撤销操作
const performUndo = () => {
    // 如果正在绘制或平移，或者已保存，禁止撤销
    if (drawing.value || isDragging || isCurrentSaved.value) return;

    const currentImage = images.value[currentImageIndex.value];
    if (!currentImage || currentImage.undoStack.length === 0) {
        ElMessage.info("没有可撤销的操作");
        return;
    }

    // 获取上一步状态 (历史快照)
    const prevState = currentImage.undoStack.pop();

    // 保存当前状态到 Redo 栈 (使用无损同步)
    syncCanvasStateForHistory();
    const currentState = JSON.parse(JSON.stringify(currentImage.res || []));
    currentImage.redoStack.push(currentState);

    // 恢复数据
    currentImage.res = JSON.parse(JSON.stringify(prevState));

    // 重新渲染
    reloadCanvasData(currentImage.res);

    ElMessage.success("已撤销");
};

// 执行重做操作
const performRedo = () => {
    if (drawing.value || isDragging || isCurrentSaved.value) return;

    const currentImage = images.value[currentImageIndex.value];
    if (!currentImage || currentImage.redoStack.length === 0) {
        ElMessage.info("没有可重做的操作");
        return;
    }

    // 获取下一步状态
    const nextState = currentImage.redoStack.pop();

    // 保存当前状态到 Redo 栈 (使用无损同步)
    syncCanvasStateForHistory();
    const currentState = JSON.parse(JSON.stringify(currentImage.res || []));
    currentImage.undoStack.push(currentState);

    // 恢复数据
    currentImage.res = JSON.parse(JSON.stringify(nextState));

    // 重新渲染
    reloadCanvasData(currentImage.res);

    ElMessage.success("已重做");
};

// 重置图片到初始状态
const resetImageToInitial = () => {
    if (isCurrentSaved.value) return;

    const currentImage = images.value[currentImageIndex.value];
    if (!currentImage || !currentImage.initialRes) return;

    commitHistory();

    // 恢复到 init 时备份的数据
    currentImage.res = JSON.parse(JSON.stringify(currentImage.initialRes));

    // 重新渲染
    reloadCanvasData(currentImage.res);

    // 同时复位视图
    resetView();

    ElMessage.success("已恢复到初始状态");
};

// 清理画布上的所有标注对象
const clearCanvasAnnotations = () => {
    if (!canvas) return;

    // 移除所有标注相关的对象
    const objectsToRemove = canvas.getObjects().filter((o: any) =>
        o.isAnnot || o.isLabel || o.isDirectionIndicator
    );

    if (objectsToRemove.length > 0) {
        canvas.remove(...objectsToRemove);
    }

    // 清除选中状态
    canvas.discardActiveObject();

    // 清除可能存在的临时绘制对象
    if (tempRect.rect) {
        canvas.clearContext(canvas.contextTop);
        tempRect.rect = undefined;
    }

    // 彻底清理多选组相关的全局状态
    frozenChildPositions.clear();
    groupStartLeft = 0;
    groupStartTop = 0;
    isApplyingGroupUpdate = false;
};

// 用于防止在更新组时事件重入
let isApplyingGroupUpdate = false;

// 冻结的子对象初始坐标（选中组时记录）
let frozenChildPositions: Map<string, { x: number; y: number; w: number; h: number }> = new Map();
let groupStartLeft = 0;
let groupStartTop = 0;

// 防抖时间戳
let lastModifiedTime = 0;
const DEBOUNCE_THRESHOLD = 50; // 50ms 内的重复事件只处理一次

function setupCanvas() {
    if (!canvasRef.value) return;

    if (canvas) {
        canvas.dispose();
        canvas = null;
    }

    // 定义一个标志位，用于识别是否是程序内部为了刷新状态而触发的选择变更。
    let isProgrammaticSelectionChange = false;

    canvas = new fabric.Canvas(canvasRef.value, {
        selection: true,
        preserveObjectStacking: true,
        backgroundColor: 'transparent',
        fireRightClick: true,
        fireMiddleClick: true,
        stopContextMenu: true,
    });

    resizeCanvasToContainer();
    if (canvasContainerRef.value) {
        resizeObserver = new ResizeObserver(() => {
            // 当侧边栏动画进行时，这里会高频触发
            // 我们调用同步重绘逻辑，就能实现丝滑过渡
            resizeCanvasToContainer();
        });
        resizeObserver.observe(canvasContainerRef.value);
    }

    canvas.on("mouse:wheel", onMouseWheel);
    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);

    canvas.on("selection:created", onSelectionChanged);
    canvas.on("selection:updated", onSelectionChanged);

    canvas.on("selection:cleared", () => {
        if (isProgrammaticSelectionChange) return;

        setTimeout(() => {
            if (canvas && canvas.getActiveObject()) return;

            requestAnimationFrame(() => {
                selectedBox.value = null;
                selectedLabelEdit.value = "";
            });

            if (canvas) {
                canvas.getObjects().forEach((o: any) => {
                    if (o.isLabel) {
                        o.set({
                            backgroundColor: 'transparent',
                            stroke: null,
                            strokeWidth: 0,
                            fontWeight: 'normal',
                        });
                    }
                    if (o.isDirectionIndicator) {
                        o.set({
                            visible: false,
                            scaleX: 1,
                            scaleY: 1,
                            shadow: null,
                        });
                    }
                });
                canvas.renderAll();
            }
        }, 0);

        frozenChildPositions.clear();
    });

    canvas.on("object:modified", (e) => {
        const now = Date.now();
        if (now - lastModifiedTime < DEBOUNCE_THRESHOLD) {
            return;
        }
        lastModifiedTime = now;

        const obj = e.target;
        if (!obj || (!(obj as any).isAnnot && obj.type !== 'group' && obj.type !== 'activeselection')) return;

        const currentImage = images.value[currentImageIndex.value];

        if (dragStartState.value && currentImage) {
            currentImage.undoStack.push(dragStartState.value);
            currentImage.redoStack = [];
            if (currentImage.undoStack.length > 50) currentImage.undoStack.shift();
            dragStartState.value = null;
        }

        if (isApplyingGroupUpdate) return;

        if (obj.type === 'group' || obj.type === 'activeselection') {
            let objects: any[] = [];
            if ('getObjects' in obj && typeof obj.getObjects === 'function') {
                objects = obj.getObjects();
            } else if ('_objects' in obj && Array.isArray((obj as any)._objects)) {
                objects = (obj as any)._objects;
            }

            if (objects.length === 0) return;

            const groupScaleX = obj.scaleX || 1;
            const groupScaleY = obj.scaleY || 1;
            const groupAngle = obj.angle || 0;
            const groupSkewX = obj.skewX || 0;
            const groupSkewY = obj.skewY || 0;

            let hasChildSkew = false;
            objects.forEach((child: any) => {
                if (!child.isAnnot) return;
                const matrix = child.calcTransformMatrix();
                const decomposed = fabric.util.qrDecompose(matrix);
                if (Math.abs(decomposed.skewX) > 0.001 || Math.abs(decomposed.skewY || 0) > 0.001) {
                    hasChildSkew = true;
                }
            });

            const isPureScaleOrResize = Math.abs(groupAngle) < 0.001 &&
                Math.abs(groupSkewX) < 0.001 &&
                Math.abs(groupSkewY) < 0.001 &&
                !hasChildSkew &&
                (Math.abs(groupScaleX - 1) > 0.001 || Math.abs(groupScaleY - 1) > 0.001);

            const isPureMove = Math.abs(groupAngle) < 0.001 &&
                Math.abs(groupSkewX) < 0.001 &&
                Math.abs(groupSkewY) < 0.001 &&
                !hasChildSkew &&
                Math.abs(groupScaleX - 1) < 0.001 &&
                Math.abs(groupScaleY - 1) < 0.001;

            const hasRotationOrSkew = Math.abs(groupAngle) > 0.001 ||
                Math.abs(groupSkewX) > 0.001 ||
                Math.abs(groupSkewY) > 0.001 ||
                hasChildSkew;
            const transformContext = {
                isPureScaleOrResize,
                isPureMove,
                hasRotationOrSkew,
                groupScaleX,
                groupScaleY,
                groupStartLeft,
                groupStartTop,
            };

            const globalTransforms: any[] = [];

            objects.forEach((child: any) => {
                if (!child.isAnnot) return;

                const matrix = child.calcTransformMatrix();

                if (child.type === 'polygon') {
                    const absolutePoints = child.get('points').map((p: any) => {
                        const point = new fabric.Point(p.x, p.y);
                        return fabric.util.transformPoint(point, matrix);
                    });

                    const xs = absolutePoints.map(p => p.x);
                    const ys = absolutePoints.map(p => p.y);
                    const decomposed = fabric.util.qrDecompose(matrix);

                    globalTransforms.push({
                        object_id: child.object_id,
                        type: 'polygon',
                        x: Math.min(...xs),
                        y: Math.min(...ys),
                        width: Math.max(...xs) - Math.min(...xs),
                        height: Math.max(...ys) - Math.min(...ys),
                        angle: 0,
                        originalPoints: absolutePoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
                        centerX: decomposed.translateX,
                        centerY: decomposed.translateY,
                    });

                } else {
                    const halfW = child.width / 2;
                    const halfH = child.height / 2;
                    const localCorners = [
                        new fabric.Point(-halfW, -halfH),
                        new fabric.Point(halfW, -halfH),
                        new fabric.Point(halfW, halfH),
                        new fabric.Point(-halfW, halfH)
                    ];

                    const realPoints = localCorners.map(p => {
                        const transP = fabric.util.transformPoint(p, matrix);
                        return { x: Math.round(transP.x), y: Math.round(transP.y) };
                    });

                    const decomposed = fabric.util.qrDecompose(matrix);
                    let finalLeft, finalTop, finalActualWidth, finalActualHeight;
                    let frozenPos = frozenChildPositions.get(child.object_id);

                    if (!frozenPos) {
                        const boxData = boxes.value.find(b => b.object_id === child.object_id);
                        if (boxData) {
                            frozenPos = { x: boxData.x, y: boxData.y, w: boxData.w, h: boxData.h };
                            frozenChildPositions.set(child.object_id, frozenPos);
                        }
                    }

                    if ((transformContext.isPureMove || transformContext.isPureScaleOrResize) && frozenPos) {
                        if (transformContext.isPureMove) {
                            const deltaX = (obj.left || 0) - transformContext.groupStartLeft;
                            const deltaY = (obj.top || 0) - transformContext.groupStartTop;
                            finalLeft = frozenPos.x + deltaX;
                            finalTop = frozenPos.y + deltaY;
                            finalActualWidth = frozenPos.w;
                            finalActualHeight = frozenPos.h;
                        } else {
                            const frozenCenterX = frozenPos.x + frozenPos.w / 2;
                            const frozenCenterY = frozenPos.y + frozenPos.h / 2;
                            const offsetX = frozenCenterX - transformContext.groupStartLeft;
                            const offsetY = frozenCenterY - transformContext.groupStartTop;
                            const newCenterX = (obj.left || 0) + (offsetX * transformContext.groupScaleX);
                            const newCenterY = (obj.top || 0) + (offsetY * transformContext.groupScaleY);
                            finalActualWidth = frozenPos.w * transformContext.groupScaleX;
                            finalActualHeight = frozenPos.h * transformContext.groupScaleY;
                            finalLeft = newCenterX - finalActualWidth / 2;
                            finalTop = newCenterY - finalActualHeight / 2;
                        }
                    } else {
                        const newTopLeft = fabric.util.transformPoint(
                            new fabric.Point(-child.width / 2, -child.height / 2),
                            matrix
                        );
                        finalLeft = newTopLeft.x;
                        finalTop = newTopLeft.y;
                        finalActualWidth = child.width * decomposed.scaleX;
                        finalActualHeight = child.height * decomposed.scaleY;
                    }

                    globalTransforms.push({
                        object_id: child.object_id,
                        type: 'aabb',
                        left: finalLeft,
                        top: finalTop,
                        width: child.width,
                        height: child.height,
                        scaleX: decomposed.scaleX,
                        scaleY: decomposed.scaleY,
                        skewX: decomposed.skewX,
                        skewY: decomposed.skewY || 0,
                        angle: decomposed.angle,
                        actualWidth: finalActualWidth,
                        actualHeight: finalActualHeight,
                        originalPoints: realPoints,
                        centerX: decomposed.translateX,
                        centerY: decomposed.translateY,
                        needsHardBake: transformContext.isPureScaleOrResize && !transformContext.hasRotationOrSkew,
                    });
                }
            });

            isApplyingGroupUpdate = true;

            requestAnimationFrame(() => {
                if (!canvas || !canvas.getActiveObject()) {
                    isApplyingGroupUpdate = false;
                    return;
                }

                const activeSelection = canvas.getActiveObject() as fabric.ActiveSelection;
                if (!activeSelection || typeof activeSelection.getObjects !== 'function') {
                    isApplyingGroupUpdate = false;
                    return;
                }

                const currentObjects = activeSelection.getObjects();
                const currentImage = images.value[currentImageIndex.value];

                if (transformContext.isPureScaleOrResize && !transformContext.hasRotationOrSkew) {
                    canvas.discardActiveObject();
                }

                currentObjects.forEach((child: any) => {
                    if (!child.isAnnot) return;
                    const transform = globalTransforms.find(t => t.object_id === child.object_id);
                    if (!transform) return;

                    if (transform.needsHardBake && child.type !== 'polygon') {
                        child.set({
                            left: transform.left,
                            top: transform.top,
                            scaleX: transform.scaleX,
                            scaleY: transform.scaleY,
                            angle: transform.angle,
                            skewX: transform.skewX,
                            skewY: transform.skewY,
                        });
                        child.setCoords();
                    }

                    if (child.type === 'polygon') {
                        child.originalX = transform.x;
                        child.originalY = transform.y;
                        child.originalWidth = transform.width;
                        child.originalHeight = transform.height;
                        child.originalPoints = transform.originalPoints;
                        child.originalAngle = 0;
                    } else {
                        child.originalX = transform.left;
                        child.originalY = transform.top;
                        child.originalWidth = transform.actualWidth;
                        child.originalHeight = transform.actualHeight;

                        if (Math.abs(transform.skewX) > 0.001 || Math.abs(transform.skewY) > 0.001) {
                            const [p1, p2] = transform.originalPoints;
                            child.originalAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
                        } else {
                            child.originalAngle = transform.angle;
                        }

                        child.originalScaleX = transform.scaleX;
                        child.originalScaleY = transform.scaleY;
                        child.originalSkewX = transform.skewX;
                        child.originalSkewY = transform.skewY;
                        child.originalPoints = transform.originalPoints;
                    }

                    const textObj = canvas!.getObjects().find((o: any) => o.isLabel && o.parentId === child.object_id);
                    if (textObj) {
                        const safePos = getSafeLabelPosition(child);
                        textObj.set({ left: safePos.left, top: safePos.top });
                    }

                    const indicator = canvas!.getObjects().find((o: any) => o.isDirectionIndicator && o.parentId === child.object_id);
                    if (indicator) {
                        let indicatorAngle = transform.angle || 0;
                        if (child.type === 'polygon' && transform.originalPoints?.length >= 2) {
                            const [p1, p2] = transform.originalPoints;
                            indicatorAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
                        }
                        indicator.set({ left: transform.centerX, top: transform.centerY, angle: indicatorAngle });
                    }

                    const idx = boxes.value.findIndex(b => b.object_id === child.object_id);
                    if (idx >= 0) {
                        let finalPoints = [];
                        let finalOriginalPoints = null;
                        const isTransformed = Math.abs(transform.angle) > 0.01 ||
                            Math.abs(transform.skewX) > 0.01 ||
                            Math.abs(transform.skewY) > 0.01;

                        if (child.type === 'polygon' || isTransformed) {
                            finalPoints = transform.originalPoints;
                            finalOriginalPoints = transform.originalPoints;
                        } else {
                            const x = Math.round(child.originalX);
                            const y = Math.round(child.originalY);
                            const w = Math.round(child.originalWidth);
                            const h = Math.round(child.originalHeight);
                            finalPoints = [{ x: x, y: y }, { x: x + w, y: y + h }];
                        }

                        boxes.value[idx] = {
                            ...boxes.value[idx],
                            x: child.originalX,
                            y: child.originalY,
                            w: child.originalWidth,
                            h: child.originalHeight,
                            angle: child.originalAngle || 0,
                            points: finalPoints,
                            originalPoints: finalOriginalPoints
                        };
                    }

                    if (currentImage) {
                        const resIdx = currentImage.res.findIndex((r: any) => r.object_id === child.object_id);
                        if (resIdx >= 0) {
                            if (child.type === 'polygon') {
                                currentImage.res[resIdx] = {
                                    ...currentImage.res[resIdx],
                                    type: 'obb',
                                    x: transform.x,
                                    y: transform.y,
                                    width: transform.width,
                                    height: transform.height,
                                    angle: 0,
                                    originalPoints: transform.originalPoints,
                                };
                            } else {
                                const isRotated = Math.abs(transform.angle) > 0.01 ||
                                    Math.abs(transform.skewX) > 0.01 ||
                                    Math.abs(transform.skewY) > 0.01;
                                currentImage.res[resIdx] = {
                                    ...currentImage.res[resIdx],
                                    type: isRotated ? 'obb' : 'aabb',
                                    x: transform.left,
                                    y: transform.top,
                                    width: transform.width,
                                    height: transform.height,
                                    scaleX: transform.scaleX,
                                    scaleY: transform.scaleY,
                                    skewX: transform.skewX,
                                    skewY: transform.skewY,
                                    angle: transform.angle,
                                    originalPoints: transform.originalPoints,
                                };
                            }
                        }
                    }
                });

                if (transformContext.isPureScaleOrResize && !transformContext.hasRotationOrSkew) {
                    isProgrammaticSelectionChange = true;
                    const newSelection = new fabric.ActiveSelection(currentObjects, { canvas: canvas });
                    canvas.setActiveObject(newSelection);

                    frozenChildPositions.clear();
                    groupStartLeft = newSelection.left || 0;
                    groupStartTop = newSelection.top || 0;
                    currentObjects.forEach((child: any) => {
                        if (child.isAnnot) {
                            frozenChildPositions.set(child.object_id, {
                                x: child.originalX,
                                y: child.originalY,
                                w: child.originalWidth,
                                h: child.originalHeight
                            });
                        }
                    });
                } else {
                    frozenChildPositions.clear();
                    groupStartLeft = activeSelection.left || 0;
                    groupStartTop = activeSelection.top || 0;
                    currentObjects.forEach((child: any) => {
                        if (child.isAnnot) {
                            frozenChildPositions.set(child.object_id, {
                                x: child.originalX,
                                y: child.originalY,
                                w: child.originalWidth,
                                h: child.originalHeight
                            });
                        }
                    });
                }

                canvas.requestRenderAll();
                requestAnimationFrame(() => {
                    isProgrammaticSelectionChange = false;
                    isApplyingGroupUpdate = false;

                    if (selectionMode.value === 'axis') {
                        const currentImage = images.value[currentImageIndex.value];
                        if (currentImage && currentImage.res) {
                            reloadCanvasData(currentImage.res);
                        }
                    }
                });
            });

            return;
        }

        if ((obj as any).isAnnot) {
            if (isSelecting.value) return;
            updateObjectRealtime(obj);

            if (obj.type === 'polygon') {
                const matrix = obj.calcTransformMatrix();
                const absolutePoints = obj.get('points').map((p) => {
                    const point = new fabric.Point(p.x, p.y);
                    const transformed = fabric.util.transformPoint(point, matrix);
                    return { x: Math.round(transformed.x), y: Math.round(transformed.y) };
                });
                obj.originalPoints = absolutePoints;
                const xs = absolutePoints.map(p => p.x);
                const ys = absolutePoints.map(p => p.y);
                obj.originalX = Math.min(...xs);
                obj.originalY = Math.min(...ys);
                obj.originalWidth = Math.max(...xs) - obj.originalX;
                obj.originalHeight = Math.max(...ys) - obj.originalY;
                obj.originalAngle = 0;
            } else {
                const matrix = obj.calcTransformMatrix();
                const halfW = obj.width / 2;
                const halfH = obj.height / 2;
                const localCorners = [
                    new fabric.Point(-halfW, -halfH),
                    new fabric.Point(halfW, -halfH),
                    new fabric.Point(halfW, halfH),
                    new fabric.Point(-halfW, halfH)
                ];
                const realPoints = localCorners.map(p => {
                    const transP = fabric.util.transformPoint(p, matrix);
                    return { x: Math.round(transP.x), y: Math.round(transP.y) };
                });

                obj.originalX = obj.left;
                obj.originalY = obj.top;
                obj.originalWidth = obj.width * obj.scaleX;
                obj.originalHeight = obj.height * obj.scaleY;
                obj.originalAngle = obj.angle || 0;
                obj.originalScaleX = obj.scaleX || 1;
                obj.originalScaleY = obj.scaleY || 1;
                obj.originalSkewX = obj.skewX || 0;
                obj.originalSkewY = obj.skewY || 0;

                const hasTransform = Math.abs(obj.angle || 0) > 0.01 || Math.abs(obj.skewX || 0) > 0.01 || Math.abs(obj.skewY || 0) > 0.01;
                obj.originalPoints = hasTransform ? realPoints : null;
            }

            const currentImage = images.value[currentImageIndex.value];
            if (currentImage) {
                const resIdx = currentImage.res.findIndex((r: any) => r.object_id === obj.object_id);
                if (resIdx >= 0) {
                    if (obj.type === 'polygon') {
                        currentImage.res[resIdx] = {
                            ...currentImage.res[resIdx],
                            type: 'obb',
                            x: obj.originalX,
                            y: obj.originalY,
                            width: obj.originalWidth,
                            height: obj.originalHeight,
                            angle: 0,
                            originalPoints: obj.originalPoints,
                        };
                    } else {
                        const isRotated = Math.abs(obj.originalAngle) > 0.01 ||
                            Math.abs(obj.originalSkewX) > 0.01 ||
                            Math.abs(obj.originalSkewY) > 0.01;
                        currentImage.res[resIdx] = {
                            ...currentImage.res[resIdx],
                            type: isRotated ? 'obb' : 'aabb',
                            x: obj.originalX,
                            y: obj.originalY,
                            width: obj.width,
                            height: obj.height,
                            scaleX: obj.scaleX || 1,
                            scaleY: obj.scaleY || 1,
                            skewX: obj.skewX || 0,
                            skewY: obj.skewY || 0,
                            angle: obj.originalAngle || 0,
                            originalPoints: obj.originalPoints,
                        };
                    }
                }
            }
        }

        if (selectionMode.value === 'axis') {
            const currentImage = images.value[currentImageIndex.value];
            if (currentImage && currentImage.res) {
                requestAnimationFrame(() => {
                    reloadCanvasData(currentImage.res);
                });
            }
        }
    });

    const onObjectMove = (e) => {
        if (isDragging) return;
        const obj = e.target;
        if (obj && (obj.type === 'group' || obj.type === 'activeselection')) {
            handleGroupRealtime(obj);
        } else {
            onObjectMoving(e);
            adjustRotationPointPosition(e);
        }
    };

    canvas.on("object:moving", onObjectMove);
    canvas.on("object:scaling", onObjectMove);
    canvas.on("object:rotating", onObjectMove);

    const recordFrozenPositions = (e: fabric.IEvent) => {
        adjustRotationPointPosition(e);
        requestAnimationFrame(() => adjustRotationPointPosition(e));

        const activeObj = canvas?.getActiveObject();
        if (activeObj && (activeObj.type === 'group' || activeObj.type === 'activeselection')) {
            frozenChildPositions.clear();
            groupStartLeft = activeObj.left || 0;
            groupStartTop = activeObj.top || 0;

            let objects: any[] = [];
            if ('getObjects' in activeObj && typeof activeObj.getObjects === 'function') {
                objects = activeObj.getObjects();
            } else if ('_objects' in activeObj && Array.isArray((activeObj as any)._objects)) {
                objects = (activeObj as any)._objects;
            }

            objects.forEach((child: any) => {
                if (child.isAnnot) {
                    const boxData = boxes.value.find(b => b.object_id === child.object_id);
                    if (boxData) {
                        frozenChildPositions.set(child.object_id, {
                            x: boxData.x,
                            y: boxData.y,
                            w: boxData.w,
                            h: boxData.h
                        });
                    }
                }
            });
        }
    };

    canvas.on("selection:created", recordFrozenPositions);
    canvas.on("selection:updated", recordFrozenPositions);

    setupKeyboardShortcuts();
}

function setupKeyboardShortcuts() {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!canvas) return;

        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }

        if (isCurrentSaved.value) {
            const isHelpKey = e.key === 'h' || e.key === 'H' || e.key === '?';
            if (!isHelpKey) {
                return;
            }
        }

        if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
            if (e.shiftKey) {
                performRedo();
            } else {
                performUndo();
            }
            e.preventDefault();
            return;
        }

        if ((e.key === 'y' || e.key === 'Y') && (e.ctrlKey || e.metaKey)) {
            performRedo();
            e.preventDefault();
            return;
        }

        const activeObject = canvas.getActiveObject();

        if (!activeObject) {
            if (e.key === 'h' || e.key === 'H' || e.key === '?') {
                showKeyboardShortcuts();
                e.preventDefault();
            }
            return;
        }

        const isAnnotObject = (activeObject as any).isAnnot;
        const isGroup = activeObject.type === 'group' || activeObject.type === 'activeselection';

        if (!isAnnotObject && !isGroup) {
            if (e.key === 'h' || e.key === 'H' || e.key === '?') {
                showKeyboardShortcuts();
                e.preventDefault();
            }
            return;
        }

        const step = e.shiftKey ? 10 : 1;
        let needsUpdate = false;

        const modificationKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'r', 'R', 'e', 'E',
            '+', '=', '-', '_',
            'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', 'q', 'Q'
        ];

        if (modificationKeys.includes(e.key)) {
            if (!e.repeat) {
                commitHistory();

                dragStartState.value = null;
            }
        }

        switch (e.key) {
            case 'ArrowLeft':
                activeObject.set('left', (activeObject.left || 0) - step);
                needsUpdate = true;
                e.preventDefault();
                break;

            case 'ArrowRight':
                activeObject.set('left', (activeObject.left || 0) + step);
                needsUpdate = true;
                e.preventDefault();
                break;

            case 'ArrowUp':
                activeObject.set('top', (activeObject.top || 0) - step);
                needsUpdate = true;
                e.preventDefault();
                break;

            case 'ArrowDown':
                activeObject.set('top', (activeObject.top || 0) + step);
                needsUpdate = true;
                e.preventDefault();
                break;

            case 'r':
            case 'R':
                const rotateStep = e.shiftKey ? 1 : 15;
                const newAngleR = (activeObject.angle || 0) + rotateStep;
                activeObject.rotate(newAngleR);

                if ((activeObject as any).isAnnot && activeObject.type !== 'polygon') {
                    (activeObject as any).originalAngle = newAngleR;
                }

                needsUpdate = true;
                e.preventDefault();
                break;

            case 'e':
            case 'E':
                const rotateStepReverse = e.shiftKey ? 1 : 15;
                const newAngleE = (activeObject.angle || 0) - rotateStepReverse;
                activeObject.rotate(newAngleE);

                if ((activeObject as any).isAnnot && activeObject.type !== 'polygon') {
                    (activeObject as any).originalAngle = newAngleE;
                }

                needsUpdate = true;
                e.preventDefault();
                break;

            case '+':
            case '=':
                const scaleUpFactor = e.shiftKey ? 1.01 : 1.1;

                activeObject.set({
                    scaleX: (activeObject.scaleX || 1) * scaleUpFactor,
                    scaleY: (activeObject.scaleY || 1) * scaleUpFactor
                });

                needsUpdate = true;
                e.preventDefault();
                break;

            case '-':
            case '_':
                const scaleDownFactor = e.shiftKey ? 0.99 : 0.9;
                const currentScaleX = activeObject.scaleX || 1;
                const currentScaleY = activeObject.scaleY || 1;

                const newScaleX = Math.max(0.01, currentScaleX * scaleDownFactor);
                const newScaleY = Math.max(0.01, currentScaleY * scaleDownFactor);

                activeObject.set({
                    scaleX: newScaleX,
                    scaleY: newScaleY
                });

                needsUpdate = true;
                e.preventDefault();
                break;

            case 'w':
            case 'W':
                if (isGroup) {
                    const widthScaleFactor = e.shiftKey ? 1.01 : 1.1;
                    activeObject.set('scaleX', (activeObject.scaleX || 1) * widthScaleFactor);
                    needsUpdate = true;
                } else if (activeObject.type === 'rect') {
                    const widthStep = e.shiftKey ? 10 : 1;
                    activeObject.set('width', (activeObject.width || 0) + widthStep);
                    needsUpdate = true;
                } else if (activeObject.type === 'polygon') {
                    const widthScaleFactor = e.shiftKey ? 1.01 : 1.1;
                    activeObject.set('scaleX', (activeObject.scaleX || 1) * widthScaleFactor);
                    needsUpdate = true;
                }
                e.preventDefault();
                break;

            case 'q':
            case 'Q':
                if (isGroup) {
                    const widthScaleFactor = e.shiftKey ? 0.99 : 0.9;
                    activeObject.set('scaleX', Math.max(0.1, (activeObject.scaleX || 1) * widthScaleFactor));
                    needsUpdate = true;
                } else if (activeObject.type === 'rect') {
                    const widthStep = e.shiftKey ? 10 : 1;
                    activeObject.set('width', Math.max(10, (activeObject.width || 0) - widthStep));
                    needsUpdate = true;
                } else if (activeObject.type === 'polygon') {
                    const widthScaleFactor = e.shiftKey ? 0.99 : 0.9;
                    activeObject.set('scaleX', Math.max(0.1, (activeObject.scaleX || 1) * widthScaleFactor));
                    needsUpdate = true;
                }
                e.preventDefault();
                break;

            case 's':
            case 'S':
                if (isGroup) {
                    const heightScaleFactor = e.shiftKey ? 1.01 : 1.1;
                    activeObject.set('scaleY', (activeObject.scaleY || 1) * heightScaleFactor);
                    needsUpdate = true;
                    e.preventDefault();
                } else if (activeObject.type === 'rect' && !e.ctrlKey && !e.metaKey) {
                    const heightStep = e.shiftKey ? 10 : 1;
                    activeObject.set('height', (activeObject.height || 0) + heightStep);
                    needsUpdate = true;
                    e.preventDefault();
                } else if (activeObject.type === 'polygon' && !e.ctrlKey && !e.metaKey) {
                    const heightScaleFactor = e.shiftKey ? 1.01 : 1.1;
                    activeObject.set('scaleY', (activeObject.scaleY || 1) * heightScaleFactor);
                    needsUpdate = true;
                    e.preventDefault();
                }
                break;

            case 'a':
            case 'A':
                if (isGroup) {
                    const heightScaleFactor = e.shiftKey ? 0.99 : 0.9;
                    activeObject.set('scaleY', Math.max(0.1, (activeObject.scaleY || 1) * heightScaleFactor));
                    needsUpdate = true;
                    e.preventDefault();
                } else if (activeObject.type === 'rect' && !e.ctrlKey && !e.metaKey) {
                    const heightStep = e.shiftKey ? 10 : 1;
                    activeObject.set('height', Math.max(10, (activeObject.height || 0) - heightStep));
                    needsUpdate = true;
                    e.preventDefault();
                } else if (activeObject.type === 'polygon' && !e.ctrlKey && !e.metaKey) {
                    const heightScaleFactor = e.shiftKey ? 0.99 : 0.9;
                    activeObject.set('scaleY', Math.max(0.1, (activeObject.scaleY || 1) * heightScaleFactor));
                    needsUpdate = true;
                    e.preventDefault();
                }
                break;

            case 'Delete':
            case 'Backspace':
                if (selectedBox.value !== null && selectedBox.value !== undefined) {
                    deleteSelectedBox();
                } else {
                    console.warn('Delete key pressed but no selection');
                    ElMessage.warning('请先选中一个矩形框');
                }
                e.preventDefault();
                break;

            case 'c':
            case 'C':
                if (e.ctrlKey || e.metaKey) {
                    copySelectedBox();
                    e.preventDefault();
                }
                break;

            case 'v':
            case 'V':
                if (e.ctrlKey || e.metaKey) {
                    pasteBox();
                    e.preventDefault();
                }
                break;

            case 'h':
            case 'H':
            case '?':
                showKeyboardShortcuts();
                e.preventDefault();
                break;
        }

        if (needsUpdate) {
            activeObject.setCoords();

            if (isGroup) {
                handleGroupRealtime(activeObject);
            } else {
                updateObjectRealtime(activeObject);
            }

            adjustRotationPointPosition({ target: activeObject });
            canvas.requestRenderAll();

            canvas.fire('object:modified', { target: activeObject });
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeyDown);
    });
}

let copiedBox: any = null;

function copySelectedBox() {
    if (!canvas) {
        ElMessage.warning('Canvas 不可用');
        return;
    }

    const activeObj = canvas.getActiveObject();

    if (!activeObj) {
        ElMessage.warning('请先选中一个矩形框');
        return;
    }

    if (activeObj.type === 'group' || activeObj.type === 'activeselection') {
        const groupData: any[] = [];

        const groupBounds = activeObj.getBoundingRect();
        const groupCenterX = groupBounds.left + groupBounds.width / 2;
        const groupCenterY = groupBounds.top + groupBounds.height / 2;

        (activeObj as fabric.Group).forEachObject((obj: fabric.Object) => {
            if (!(obj as any).isAnnot) return;

            const matrix = obj.calcTransformMatrix();
            const decomposed = fabric.util.qrDecompose(matrix);

            const objData: any = {
                label: (obj as any).label,
                color: (obj as any).color,
                object_id: (obj as any).object_id,
            };

            if (obj.type === 'polygon') {
                const absolutePoints = (obj as any).points.map((p: any) => {
                    const point = new fabric.Point(p.x, p.y);
                    return fabric.util.transformPoint(point, matrix);
                });

                const xs = absolutePoints.map((p: any) => p.x);
                const ys = absolutePoints.map((p: any) => p.y);
                const objCenterX = (Math.min(...xs) + Math.max(...xs)) / 2;
                const objCenterY = (Math.min(...ys) + Math.max(...ys)) / 2;

                objData.offsetX = objCenterX - groupCenterX;
                objData.offsetY = objCenterY - groupCenterY;
                objData.relativePoints = absolutePoints.map((p: any) => ({
                    x: p.x - objCenterX,
                    y: p.y - objCenterY,
                }));
                objData.type = 'obb';
                objData.w = Math.max(...xs) - Math.min(...xs);
                objData.h = Math.max(...ys) - Math.min(...ys);

            } else {
                const objCenterX = decomposed.translateX;
                const objCenterY = decomposed.translateY;

                objData.offsetX = objCenterX - groupCenterX;
                objData.offsetY = objCenterY - groupCenterY;
                objData.w = obj.width;
                objData.h = obj.height;
                objData.scaleX = decomposed.scaleX;
                objData.scaleY = decomposed.scaleY;
                objData.skewX = decomposed.skewX;
                objData.skewY = decomposed.skewY || 0;
                objData.angle = decomposed.angle;
                objData.type = 'aabb';
            }
            groupData.push(objData);
        });

        copiedBox = {
            isGroup: true,
            objects: groupData,
            groupCenterX: groupCenterX,
            groupCenterY: groupCenterY,
        };

        ElMessage.success(`已复制 ${groupData.length} 个矩形框（组）`);

    } else {
        if ((activeObj as any).isAnnot) {
            const matrix = activeObj.calcTransformMatrix();
            const decomposed = fabric.util.qrDecompose(matrix);

            const objData: any = {
                label: (activeObj as any).label,
                color: (activeObj as any).color,
                object_id: (activeObj as any).object_id,
                isGroup: false,
            };

            if (activeObj.type === 'polygon') {
                const absolutePoints = (activeObj as any).points.map((p: any) => {
                    const point = new fabric.Point(p.x, p.y);
                    return fabric.util.transformPoint(point, matrix);
                });

                const xs = absolutePoints.map((p: any) => p.x);
                const ys = absolutePoints.map((p: any) => p.y);
                const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
                const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;

                objData.type = 'obb';
                objData.centerX = centerX;
                objData.centerY = centerY;
                objData.relativePoints = absolutePoints.map((p: any) => ({
                    x: p.x - centerX,
                    y: p.y - centerY,
                }));
                objData.w = Math.max(...xs) - Math.min(...xs);
                objData.h = Math.max(...ys) - Math.min(...ys);

            } else {
                objData.type = 'aabb';
                objData.centerX = decomposed.translateX;
                objData.centerY = decomposed.translateY;
                objData.w = activeObj.width;
                objData.h = activeObj.height;
                objData.scaleX = decomposed.scaleX;
                objData.scaleY = decomposed.scaleY;
                objData.skewX = decomposed.skewX;
                objData.skewY = decomposed.skewY || 0;
                objData.angle = decomposed.angle;
            }

            copiedBox = objData;
            ElMessage.success('已复制矩形框');
        }
    }
}

function pasteBox() {
    if (isCurrentSaved.value) {
        ElMessage.warning("当前图片已保存，无法粘贴");
        return;
    }

    if (!canvas || !copiedBox) {
        ElMessage.warning('没有可粘贴的矩形框');
        return;
    }

    commitHistory();

    const offsetX = 20;
    const offsetY = 20;

    const getRealCorners = (obj: any) => {
        const matrix = obj.calcTransformMatrix();
        const halfW = obj.width / 2;
        const halfH = obj.height / 2;
        const localCorners = [
            new fabric.Point(-halfW, -halfH), // 左上
            new fabric.Point(halfW, -halfH),  // 右上
            new fabric.Point(halfW, halfH),   // 右下
            new fabric.Point(-halfW, halfH)   // 左下
        ];
        return localCorners.map(p => {
            const transP = fabric.util.transformPoint(p, matrix);
            return {
                x: Math.round(transP.x),
                y: Math.round(transP.y)
            };
        });
    };

    if (copiedBox.isGroup && Array.isArray(copiedBox.objects)) {
        const newObjects: any[] = [];

        const newGroupCenterX = copiedBox.groupCenterX + offsetX;
        const newGroupCenterY = copiedBox.groupCenterY + offsetY;

        copiedBox.objects.forEach((boxData: any) => {
            let newObj: any;
            let newPoints: any[] = [];
            let newOriginalPoints: any[] | null = null;

            const newObjCenterX = newGroupCenterX + boxData.offsetX;
            const newObjCenterY = newGroupCenterY + boxData.offsetY;

            if (boxData.type === 'obb' && boxData.relativePoints) {
                const absolutePoints = boxData.relativePoints.map((p: any) => ({
                    x: newObjCenterX + p.x,
                    y: newObjCenterY + p.y,
                }));

                newObj = new fabric.Polygon(boxData.relativePoints, {
                    left: newObjCenterX,
                    top: newObjCenterY,
                    originX: 'center',
                    originY: 'center',
                    stroke: boxData.color,
                    strokeWidth: 2,
                    fill: 'transparent',
                    selectable: true,
                    strokeUniform: true,
                    objectCaching: false,
                    angle: 0,
                    scaleX: 1,
                    scaleY: 1,
                    cornerStyle: 'circle',
                    cornerColor: boxData.color,
                    cornerSize: 10,
                    transparentCorners: false,
                    borderColor: boxData.color,
                    borderScaleFactor: 2,
                    borderDashArray: [5, 5],
                });

                newObj.type = 'polygon';
                newObj.originalPoints = absolutePoints;
                newOriginalPoints = absolutePoints;
                newPoints = absolutePoints;

            } else {
                const transformMatrix = fabric.util.composeMatrix({
                    angle: boxData.angle, scaleX: boxData.scaleX || 1, scaleY: boxData.scaleY || 1,
                    skewX: boxData.skewX || 0, skewY: boxData.skewY || 0,
                });
                const localTopLeft = new fabric.Point(-boxData.w / 2, -boxData.h / 2);
                const transformedTopLeft = fabric.util.transformPoint(localTopLeft, transformMatrix);
                const finalLeft = newObjCenterX + transformedTopLeft.x;
                const finalTop = newObjCenterY + transformedTopLeft.y;

                newObj = new fabric.Rect({
                    left: finalLeft,
                    top: finalTop,
                    width: boxData.w,
                    height: boxData.h,
                    angle: boxData.angle,
                    scaleX: boxData.scaleX || 1,
                    scaleY: boxData.scaleY || 1,
                    skewX: boxData.skewX || 0,
                    skewY: boxData.skewY || 0,
                    stroke: boxData.color,
                    strokeWidth: 2,
                    fill: 'transparent',
                    selectable: true,
                    strokeUniform: true,
                    originX: 'left',
                    originY: 'top',
                    objectCaching: false,
                    cornerStyle: 'circle',
                    cornerColor: boxData.color,
                    cornerSize: 10,
                    transparentCorners: false,
                    borderColor: boxData.color,
                    borderScaleFactor: 2,
                    borderDashArray: [5, 5],
                });

                newObj.originalX = finalLeft;
                newObj.originalY = finalTop;
                newObj.originalWidth = boxData.w * (boxData.scaleX || 1);
                newObj.originalHeight = boxData.h * (boxData.scaleY || 1);
                newObj.originalAngle = boxData.angle;

                const isRotated = boxData.angle && boxData.angle !== 0;
                const isSkewed = (boxData.skewX && boxData.skewX !== 0) || (boxData.skewY && boxData.skewY !== 0);

                if (isRotated || isSkewed) {
                    newOriginalPoints = getRealCorners(newObj);
                    newPoints = newOriginalPoints;
                } else {
                    newOriginalPoints = null;
                    newPoints = [
                        { x: Math.round(newObj.originalX), y: Math.round(newObj.originalY) },
                        { x: Math.round(newObj.originalX + newObj.originalWidth), y: Math.round(newObj.originalY + newObj.originalHeight) }
                    ];
                }
            }

            const objId = 'obj_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            newObj.isAnnot = true;
            newObj.object_id = objId;
            newObj.label = boxData.label;
            newObj.color = boxData.color;
            newObj.originalPoints = newOriginalPoints;

            canvas!.add(newObj);

            const safePos = getSafeLabelPosition(newObj);
            const text = new fabric.Text(newObj.label, {
                left: safePos.left,
                top: safePos.top,
                fontSize: 14,
                fill: boxData.color,
                selectable: false,
                evented: false,
            });
            (text as any).isLabel = true;
            (text as any).parentId = objId;
            canvas!.add(text);

            addDirectionIndicator(newObj);

            const boxInfo = {
                id: objId,
                object_id: objId,
                label: newObj.label,
                color: newObj.color,
                x: newObj.originalX || newObj.left,
                y: newObj.originalY || newObj.top,
                w: newObj.originalWidth || (boxData.w * (boxData.scaleX || 1)),
                h: newObj.originalHeight || (boxData.h * (boxData.scaleY || 1)),
                angle: newObj.originalAngle || boxData.angle,
                points: newPoints,
                originalPoints: newOriginalPoints,
                type: boxData.type || 'aabb',
            };

            boxes.value.push(boxInfo);

            const currentImage = images.value[currentImageIndex.value];
            if (currentImage) {
                currentImage.res.push({
                    type: boxData.type || 'aabb',
                    x: boxInfo.x,
                    y: boxInfo.y,
                    width: boxInfo.w,
                    height: boxInfo.h,
                    angle: boxInfo.angle,
                    scaleX: boxData.scaleX || 1,
                    scaleY: boxData.scaleY || 1,
                    skewX: boxData.skewX || 0,
                    skewY: boxData.skewY || 0,
                    object_id: objId,
                    label: newObj.label,
                    color: boxData.color,
                    originalPoints: newOriginalPoints,
                });
            }

            newObjects.push(newObj);
        });

        // 选中处理
        if (newObjects.length > 0) {
            canvas!.discardActiveObject();
            const selection = new fabric.ActiveSelection(newObjects, {
                canvas: canvas!,
            });
            canvas!.setActiveObject(selection);

            copiedBox.groupCenterX = newGroupCenterX;
            copiedBox.groupCenterY = newGroupCenterY;

            requestAnimationFrame(() => {
                selectedBox.value = {
                    isGroup: true,
                    objects: newObjects.map((o: any) => o.object_id),
                };
                selectedLabelEdit.value = '';
                newObjects.forEach((newObj: any) => {
                    const textObj = canvas!.getObjects().find((o: any) =>
                        o.isLabel && o.parentId === newObj.object_id
                    );
                    if (textObj) {
                        canvas!.bringObjectToFront(textObj);
                        textObj.set({
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            stroke: newObj.color || '#000',
                            strokeWidth: 1,
                            fontWeight: 'bold',
                        });
                    }
                    const indicator = canvas!.getObjects().find((o: any) =>
                        o.isDirectionIndicator && o.parentId === newObj.object_id
                    );
                    if (indicator) {
                        canvas!.bringObjectToFront(indicator);
                        indicator.set({
                            visible: true,
                            scaleX: 1.5,
                            scaleY: 1.5,
                            opacity: 1,
                            shadow: new fabric.Shadow({
                                color: newObj.color || '#4A90E2',
                                blur: 10,
                                offsetX: 0,
                                offsetY: 0,
                            }),
                        });
                    }
                });
                canvas!.requestRenderAll();
            });
        }
        ElMessage.success(`已粘贴 ${newObjects.length} 个矩形框`);

    } else {
        let newObj: any;
        let newPoints: any[] = [];
        let newOriginalPoints: any[] | null = null;

        const newCenterX = copiedBox.centerX + offsetX;
        const newCenterY = copiedBox.centerY + offsetY;

        if (copiedBox.type === 'obb' && copiedBox.relativePoints) {
            const absolutePoints = copiedBox.relativePoints.map((p: any) => ({
                x: newCenterX + p.x,
                y: newCenterY + p.y,
            }));

            newObj = new fabric.Polygon(copiedBox.relativePoints, {
                left: newCenterX,
                top: newCenterY,
                originX: 'center',
                originY: 'center',
                stroke: copiedBox.color,
                strokeWidth: 2,
                fill: 'transparent',
                selectable: true,
                strokeUniform: true,
                objectCaching: false,
                angle: 0,
                scaleX: 1,
                scaleY: 1,
                cornerStyle: 'circle',
                cornerColor: copiedBox.color,
                cornerSize: 10,
                transparentCorners: false,
                borderColor: copiedBox.color,
                borderScaleFactor: 2,
                borderDashArray: [5, 5],
            });

            newObj.type = 'polygon';
            newObj.originalPoints = absolutePoints;
            newOriginalPoints = absolutePoints;
            newPoints = absolutePoints;

        } else {
            const transformMatrix = fabric.util.composeMatrix({
                angle: copiedBox.angle, scaleX: copiedBox.scaleX || 1, scaleY: copiedBox.scaleY || 1,
                skewX: copiedBox.skewX || 0, skewY: copiedBox.skewY || 0,
            });
            const localTopLeft = new fabric.Point(-copiedBox.w / 2, -copiedBox.h / 2);
            const transformedTopLeft = fabric.util.transformPoint(localTopLeft, transformMatrix);
            const finalLeft = newCenterX + transformedTopLeft.x;
            const finalTop = newCenterY + transformedTopLeft.y;

            newObj = new fabric.Rect({
                left: finalLeft,
                top: finalTop,
                width: copiedBox.w,
                height: copiedBox.h,
                angle: copiedBox.angle,
                scaleX: copiedBox.scaleX || 1,
                scaleY: copiedBox.scaleY || 1,
                skewX: copiedBox.skewX || 0,
                skewY: copiedBox.skewY || 0,
                stroke: copiedBox.color,
                strokeWidth: 2,
                fill: 'transparent',
                selectable: true,
                strokeUniform: true,
                originX: 'left',
                originY: 'top',
                objectCaching: false,
                cornerStyle: 'circle',
                cornerColor: copiedBox.color,
                cornerSize: 10,
                transparentCorners: false,
                borderColor: copiedBox.color,
                borderScaleFactor: 2,
                borderDashArray: [5, 5],
            });

            newObj.originalX = finalLeft;
            newObj.originalY = finalTop;
            newObj.originalWidth = copiedBox.w * (copiedBox.scaleX || 1);
            newObj.originalHeight = copiedBox.h * (copiedBox.scaleY || 1);
            newObj.originalAngle = copiedBox.angle;

            const isRotated = copiedBox.angle && copiedBox.angle !== 0;
            const isSkewed = (copiedBox.skewX && copiedBox.skewX !== 0) || (copiedBox.skewY && copiedBox.skewY !== 0);

            if (isRotated || isSkewed) {
                newOriginalPoints = getRealCorners(newObj);
                newPoints = newOriginalPoints;
            } else {
                newOriginalPoints = null;
                newPoints = [
                    { x: Math.round(newObj.originalX), y: Math.round(newObj.originalY) },
                    { x: Math.round(newObj.originalX + newObj.originalWidth), y: Math.round(newObj.originalY + newObj.originalHeight) }
                ];
            }
        }

        const objId = 'obj_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        newObj.isAnnot = true;
        newObj.object_id = objId;
        newObj.label = copiedBox.label;
        newObj.color = copiedBox.color;
        newObj.originalPoints = newOriginalPoints;

        canvas.add(newObj);

        const safePos = getSafeLabelPosition(newObj);
        const text = new fabric.Text(newObj.label, {
            left: safePos.left,
            top: safePos.top,
            fontSize: 14,
            fill: copiedBox.color,
            selectable: false,
            evented: false,
        });
        (text as any).isLabel = true;
        (text as any).parentId = objId;
        canvas.add(text);

        addDirectionIndicator(newObj);

        const boxInfo = {
            id: objId,
            object_id: objId,
            label: newObj.label,
            color: newObj.color,
            x: newObj.originalX || newObj.left,
            y: newObj.originalY || newObj.top,
            w: newObj.originalWidth || (copiedBox.w * (copiedBox.scaleX || 1)),
            h: newObj.originalHeight || (copiedBox.h * (copiedBox.scaleY || 1)),
            angle: newObj.originalAngle || copiedBox.angle,
            points: newPoints,
            originalPoints: newOriginalPoints,
            type: copiedBox.type || 'aabb',
        };

        boxes.value.push(boxInfo);

        const currentImage = images.value[currentImageIndex.value];
        if (currentImage) {
            currentImage.res.push({
                type: copiedBox.type || 'aabb',
                x: boxInfo.x,
                y: boxInfo.y,
                width: boxInfo.w,
                height: boxInfo.h,
                angle: boxInfo.angle,
                scaleX: copiedBox.scaleX || 1,
                scaleY: copiedBox.scaleY || 1,
                skewX: copiedBox.skewX || 0,
                skewY: copiedBox.skewY || 0,
                object_id: objId,
                label: newObj.label,
                color: copiedBox.color,
                originalPoints: newOriginalPoints,
            });
        }

        canvas.setActiveObject(newObj);

        copiedBox.centerX = newCenterX;
        copiedBox.centerY = newCenterY;

        canvas.renderAll();

        ElMessage.success('已粘贴矩形框');
    }
}

function showKeyboardShortcuts() {
    shortcutDialogVisible.value = true;
}

function adjustRotationPointPosition(e?: any) {
    if (!canvas) return;

    const activeObject = e?.target || canvas.getActiveObject();
    if (!activeObject || !(activeObject as any).isAnnot) return;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const threshold = 60;

    activeObject.setCoords();

    const boundingRect = activeObject.getBoundingRect();

    try {
        if (!activeObject.controls.mtr) {
            console.warn('mtr control not found, using default');
            return;
        }

        if (boundingRect.top < threshold) {
            // 靠近顶部 -> 旋转点向下移动（放在底部）
            activeObject.controls.mtr.offsetY = 40;
            activeObject.controls.mtr.offsetX = 0;
        } else if (boundingRect.top + boundingRect.height > canvasHeight - threshold) {
            // 靠近底部 -> 旋转点向上移动
            activeObject.controls.mtr.offsetY = -50;
            activeObject.controls.mtr.offsetX = 0;
        } else if (boundingRect.left < threshold) {
            // 靠近左边 -> 旋转点稍微偏移
            activeObject.controls.mtr.offsetY = -40;
            activeObject.controls.mtr.offsetX = 20;
        } else if (boundingRect.left + boundingRect.width > canvasWidth - threshold) {
            // 靠近右边 -> 旋转点稍微偏移
            activeObject.controls.mtr.offsetY = -40;
            activeObject.controls.mtr.offsetX = -20;
        } else {
            // 不在边缘 -> 使用默认偏移
            activeObject.controls.mtr.offsetY = -40; // Fabric.js 默认值
            activeObject.controls.mtr.offsetX = 0;
        }

        activeObject.setControlVisible('mtr', true);

        activeObject.setCoords();

    } catch (error) {
        console.error('Error adjusting rotation point:', error);
    }

    canvas.renderAll();
}

function resizeCanvasToContainer() {
    if (!canvas || !canvasContainerRef.value) return;
    const container = canvasContainerRef.value;
    canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight
    });

    canvas.calcOffset();

    resetView(true);
}

function onMouseWheel(opt: any) {
    const delta = opt.e.deltaY;
    if (!canvas) return;

    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;

    if (zoom > 10) zoom = 10;
    if (zoom < 0.1) zoom = 0.1;

    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);

    opt.e.preventDefault();
    opt.e.stopPropagation();
}

function resetView(forceSync = false) {
    if (!canvas) return;
    const img = canvas.backgroundImage;
    if (!img) return;

    const imgW = (img as any).width;
    const imgH = (img as any).height;
    const canvasW = canvas.getWidth();
    const canvasH = canvas.getHeight();

    const scaleX = (canvasW * 0.9) / imgW;
    const scaleY = (canvasH * 0.9) / imgH;
    const startZoom = Math.min(scaleX, scaleY, 1); // 默认不放大超过1倍

    canvas.setZoom(startZoom);

    // 计算居中偏移
    const vpt = canvas.viewportTransform;
    if (vpt) {
        vpt[0] = startZoom; // scaleX
        vpt[3] = startZoom; // scaleY
        vpt[4] = (canvasW - imgW * startZoom) / 2; // translateX
        vpt[5] = (canvasH - imgH * startZoom) / 2; // translateY
    }

    const activeObj = canvas.getActiveObject();
    if (activeObj) {
        activeObj.setCoords();

        adjustRotationPointPosition({ target: activeObj });
    }

    if (forceSync) {
        canvas.renderAll();
    } else {
        canvas.requestRenderAll();
    }
}

function loadCurrentImage() {
    if (!canvas) return;

    dragStartState.value = null;

    const imgInfo = images.value[currentImageIndex.value];
    if (!imgInfo?.url) {
        console.warn("图片 URL 无效");
        return;
    }

    isImageSwitching.value = true;
    isLoading.value = true;

    canvas.clear();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]); // 重置视口

    const imageElement = new Image();
    imageElement.src = imgInfo.url;
    imageElement.onload = () => {
        if (!canvas) {
            isImageSwitching.value = false;
            return;
        }
        canvas.clear();
        const img = new fabric.Image(imageElement, {
            selectable: false,
            evented: false,
            originX: "left",
            originY: "top",
        });

        img.set({
            left: 0,
            top: 0,
            scaleX: 1,
            scaleY: 1,
        });

        canvas.set({
            backgroundImage: img,
        });
        resetView();
        renderResBoxes(imgInfo.res || []);

        updateBoxesFromOriginalData(imgInfo.res || []);

        isImageSwitching.value = false;
        isLoading.value = false;
    };

    imageElement.onerror = (e) => {
        console.error("图片加载失败:", e);
        ElMessage.error(`图片加载失败：${imgInfo.url}`);

        isImageSwitching.value = false;
        isLoading.value = false;
    };
}

function updateBoxesFromOriginalData(resList) {
    if (!canvas) return;

    const canvasObjectsMap = new Map();
    canvas.getObjects().forEach(obj => {
        if ((obj as any).isAnnot) {
            canvasObjectsMap.set((obj as any).object_id, obj);
        }
    });

    boxes.value = (resList || []).map((r) => {
        const obj = canvasObjectsMap.get(r.object_id);

        let points = [];
        let actualX = r.x;
        let actualY = r.y;
        let actualWidth = r.width;
        let actualHeight = r.height;
        let actualAngle = r.angle || 0;
        let finalOriginalPoints = null; // 默认为 null，表示普通矩形

        if (obj) {
            if (obj.type === 'polygon') {
                const matrix = obj.calcTransformMatrix();
                points = obj.get('points').map((p: any) => {
                    const point = new fabric.Point(p.x, p.y);
                    const transformed = fabric.util.transformPoint(point, matrix);
                    return {
                        x: Math.round(transformed.x),
                        y: Math.round(transformed.y)
                    };
                });

                const xs = points.map((p: any) => p.x);
                const ys = points.map((p: any) => p.y);
                actualX = Math.min(...xs);
                actualY = Math.min(...ys);
                actualWidth = Math.max(...xs) - actualX;
                actualHeight = Math.max(...ys) - actualY;
                actualAngle = 0;

                finalOriginalPoints = points;

            } else {
                actualWidth = obj.width * (obj.scaleX || 1);
                actualHeight = obj.height * (obj.scaleY || 1);
                actualAngle = obj.angle || 0;

                const isRotated = Math.abs(actualAngle) > 0.01;
                const isSkewed = Math.abs(obj.skewX || 0) > 0.01 || Math.abs(obj.skewY || 0) > 0.01;

                if (isRotated || isSkewed) {
                    const matrix = obj.calcTransformMatrix();
                    const halfW = obj.width / 2;
                    const halfH = obj.height / 2;
                    const localCorners = [
                        new fabric.Point(-halfW, -halfH),
                        new fabric.Point(halfW, -halfH),
                        new fabric.Point(halfW, halfH),
                        new fabric.Point(-halfW, halfH)
                    ];
                    points = localCorners.map(p => {
                        const pt = fabric.util.transformPoint(p, matrix);
                        return { x: Math.round(pt.x), y: Math.round(pt.y) };
                    });

                    finalOriginalPoints = points;

                } else {
                    const x = Math.round(obj.left);
                    const y = Math.round(obj.top);
                    const w = Math.round(actualWidth);
                    const h = Math.round(actualHeight);

                    points = [
                        { x: x, y: y },
                        { x: x + w, y: y + h }
                    ];

                    finalOriginalPoints = null;
                }

                obj.originalPoints = finalOriginalPoints;
            }
        } else {

            actualWidth = r.width * (r.scaleX || 1);
            actualHeight = r.height * (r.scaleY || 1);
            actualAngle = r.angle || 0;

            const hasComplexTransform = (r.angle && r.angle !== 0) ||
                (r.skewX && r.skewX !== 0) ||
                (r.skewY && r.skewY !== 0);

            if (r.originalPoints && r.originalPoints.length > 0) {
                points = r.originalPoints;
                finalOriginalPoints = r.originalPoints;
            } else if (hasComplexTransform) {
                const centerX = r.x + actualWidth / 2;
                const centerY = r.y + actualHeight / 2;
                const rad = (actualAngle * Math.PI) / 180;
                const cosA = Math.cos(rad);
                const sinA = Math.sin(rad);
                const corners = [
                    { x: -actualWidth / 2, y: -actualHeight / 2 },
                    { x: actualWidth / 2, y: -actualHeight / 2 },
                    { x: actualWidth / 2, y: actualHeight / 2 },
                    { x: -actualWidth / 2, y: actualHeight / 2 },
                ];
                points = corners.map((p) => ({
                    x: Math.round(centerX + p.x * cosA - p.y * sinA),
                    y: Math.round(centerY + p.x * sinA + p.y * cosA),
                }));
                finalOriginalPoints = points;
            } else {
                points = [
                    { x: Math.round(r.x), y: Math.round(r.y) },
                    { x: Math.round(r.x + actualWidth), y: Math.round(r.y + actualHeight) },
                ];
                finalOriginalPoints = null;
            }
        }

        return {
            id: r.object_id,
            object_id: r.object_id,
            label: r.label,
            color: r.color || colorForId(r.label),
            x: actualX,
            y: actualY,
            w: actualWidth,
            h: actualHeight,
            angle: actualAngle,
            points: points,
            originalPoints: finalOriginalPoints
        };
    });
}

function renderResBoxes(resList) {
    if (!canvas || !Array.isArray(resList)) return;

    canvas.discardActiveObject();

    const isLocked = isCurrentSaved.value;

    const lockProps = isLocked ? {
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        lockSkewingX: true,
        lockSkewingY: true,
        hasControls: false,
        hoverCursor: 'default',
    } : {
        hasControls: true,
        hoverCursor: 'move',
    };

    resList.forEach((res) => {
        const {
            x, y, width, height, label, color, object_id, angle = 0, type,
            originalPoints, scaleX = 1, scaleY = 1,
            skewX = 0, skewY = 0
        } = res;
        const strokeColor = color || colorForId(label);

        let obj;

        if (type === 'obb' && originalPoints && originalPoints.length >= 4) {

            let finalAngle = 0;
            let finalPoints = [];
            let finalLeft = 0;
            let finalTop = 0;

            if (selectionMode.value === 'tight') {
                const params = getTightPolygonParams(originalPoints);
                if (params) {
                    finalAngle = params.angle;
                    finalPoints = params.relativePoints;
                    finalLeft = params.centerX;
                    finalTop = params.centerY;
                } else {
                    const xs = originalPoints.map(p => p.x);
                    const ys = originalPoints.map(p => p.y);
                    finalLeft = (Math.min(...xs) + Math.max(...xs)) / 2;
                    finalTop = (Math.min(...ys) + Math.max(...ys)) / 2;
                    finalPoints = originalPoints.map(p => ({
                        x: p.x - finalLeft,
                        y: p.y - finalTop
                    }));
                    finalAngle = 0;
                }
            } else {
                const xs = originalPoints.map(p => p.x);
                const ys = originalPoints.map(p => p.y);
                finalLeft = (Math.min(...xs) + Math.max(...xs)) / 2;
                finalTop = (Math.min(...ys) + Math.max(...ys)) / 2;

                finalPoints = originalPoints.map(p => ({
                    x: p.x - finalLeft,
                    y: p.y - finalTop
                }));
                finalAngle = 0;
            }

            obj = new fabric.Polygon(finalPoints, {
                left: finalLeft,
                top: finalTop,
                originX: 'center',
                originY: 'center',
                stroke: strokeColor,
                strokeWidth: 2,
                fill: "transparent",
                selectable: true,
                strokeUniform: true,
                objectCaching: false,
                angle: finalAngle,
                scaleX: 1,
                scaleY: 1,
                cornerStyle: 'circle',
                cornerColor: strokeColor,
                cornerSize: 10,
                transparentCorners: false,
                borderColor: strokeColor,
                borderScaleFactor: 2,
                borderDashArray: [5, 5],
                hasBorders: true,
                ...lockProps
            });

            obj.type = 'polygon';
            obj.originalPoints = originalPoints;

            const xs = originalPoints.map(p => p.x);
            const ys = originalPoints.map(p => p.y);
            obj.originalX = Math.min(...xs);
            obj.originalY = Math.min(...ys);
            obj.originalWidth = Math.max(...xs) - obj.originalX;
            obj.originalHeight = Math.max(...ys) - obj.originalY;
            obj.originalAngle = finalAngle;

        } else {
            obj = new fabric.Rect({
                left: x,
                top: y,
                width: width,
                height: height,
                scaleX: scaleX,
                scaleY: scaleY,
                skewX: skewX,
                skewY: skewY,
                angle: angle,
                stroke: strokeColor,
                strokeWidth: 2,
                fill: "transparent",
                selectable: true,
                strokeUniform: true,
                originX: "left",
                originY: "top",
                objectCaching: false,
                cornerStyle: 'circle',
                cornerColor: strokeColor,
                cornerSize: 10,
                transparentCorners: false,
                borderColor: strokeColor,
                borderScaleFactor: 2,
                borderDashArray: [5, 5],
                ...lockProps
            });

            obj.originalX = x;
            obj.originalY = y;
            obj.originalWidth = width * scaleX;
            obj.originalHeight = height * scaleY;
            obj.originalAngle = angle;
            obj.originalScaleX = scaleX;
            obj.originalScaleY = scaleY;
            obj.originalSkewX = skewX;
            obj.originalSkewY = skewY;

            if (angle !== 0 || scaleX !== 1 || scaleY !== 1 || skewX !== 0 || skewY !== 0) {
                const coords = obj.getCoords(true);
                obj.originalPoints = coords.map((p: any) => ({
                    x: Math.round(p.x),
                    y: Math.round(p.y)
                }));
            }
        }

        obj.isAnnot = true;
        obj.object_id = object_id || "anno_" + Date.now();
        obj.label = label || "unknown";
        obj.color = strokeColor;

        canvas.add(obj);

        const safePos = getSafeLabelPosition(obj);
        const text = new fabric.Text(label || "", {
            left: safePos.left,
            top: safePos.top,
            fontSize: 14,
            fill: strokeColor,
            selectable: false,
            evented: false,
        });

        (text as any).isLabel = true;
        (text as any).parentId = obj.object_id;
        canvas.add(text);

        addDirectionIndicator(obj);
    });

    canvas.renderAll();
}

function addDirectionIndicator(obj: any) {
    if (!canvas) return;

    let centerX, centerY, indicatorAngle;

    if (obj.type === 'polygon') {
        centerX = obj.left;
        centerY = obj.top;

        if (obj.originalPoints && obj.originalPoints.length >= 2) {
            const topLeft = obj.originalPoints[0];   // 左上角
            const topRight = obj.originalPoints[1];  // 右上角

            const dx = topRight.x - topLeft.x;
            const dy = topRight.y - topLeft.y;

            const topEdgeAngle = Math.atan2(dy, dx) * 180 / Math.PI;

            indicatorAngle = topEdgeAngle;

            while (indicatorAngle > 180) indicatorAngle -= 360;
            while (indicatorAngle < -180) indicatorAngle += 360;
        } else {
            indicatorAngle = 0;
        }
    } else {
        indicatorAngle = (obj.angle || 0);

        if (obj.angle && obj.angle !== 0) {
            const coords = obj.getCoords(true);
            centerX = (coords[0].x + coords[1].x + coords[2].x + coords[3].x) / 4;
            centerY = (coords[0].y + coords[1].y + coords[2].y + coords[3].y) / 4;
        } else {
            centerX = obj.left + (obj.width * obj.scaleX) / 2;
            centerY = obj.top + (obj.height * obj.scaleY) / 2;
        }
    }

    const indicator = new fabric.Triangle({
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
        width: 12,
        height: 16,
        fill: obj.color || '#4A90E2',
        stroke: '#ffffff',
        strokeWidth: 3,
        paintFirst: 'stroke',
        selectable: false,
        evented: false,
        angle: indicatorAngle,
        visible: false,
        opacity: 1,
    });

    (indicator as any).isDirectionIndicator = true;
    (indicator as any).parentId = obj.object_id;

    canvas.add(indicator);
}

function prevImage() {
    if (isImageSwitching.value) return;

    if (currentImageIndex.value === 0) return;

    saveCurrentBoxesToImages();
    currentImageIndex.value--;
    selectedBox.value = null;
    selectedLabelEdit.value = "";
    loadCurrentImage();
}

function nextImage() {
    if (isImageSwitching.value) return;

    if (currentImageIndex.value >= images.value.length - 1) return;

    saveCurrentBoxesToImages();
    currentImageIndex.value++;
    selectedBox.value = null;
    selectedLabelEdit.value = "";
    loadCurrentImage();
}

function saveCurrentBoxesToImages() {
    if (!canvas) return;

    if (isImageSwitching.value) {
        console.warn("Skipping save during image switch to prevent data loss.");
        return;
    }

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const currentImage = images.value[currentImageIndex.value];
    if (!currentImage) return;

    const canvasObjects = canvas.getObjects().filter((o) => (o as any).isAnnot);

    currentImage.res = canvasObjects.map((obj: any) => {
        let result: any = {
            object_id: obj.object_id,
            label: obj.label,
            color: obj.color,
        };

        const isComplexShape = obj.type === 'polygon' ||
            (obj.angle && obj.angle !== 0) ||
            (obj.skewX && obj.skewX !== 0) ||
            (obj.skewY && obj.skewY !== 0);

        if (isComplexShape) {
            result.type = 'obb';

            const matrix = obj.calcTransformMatrix();
            let pointsSource = obj.type === 'polygon' ? obj.get('points') : [
                { x: -obj.width / 2, y: -obj.height / 2 },
                { x: obj.width / 2, y: -obj.height / 2 },
                { x: obj.width / 2, y: obj.height / 2 },
                { x: -obj.width / 2, y: obj.height / 2 }
            ];

            const absolutePoints = pointsSource.map((p: any) => {
                const point = new fabric.Point(p.x, p.y);
                const transformed = fabric.util.transformPoint(point, matrix);
                return { x: transformed.x, y: transformed.y };
            });

            const xs = absolutePoints.map((p: any) => p.x);
            const ys = absolutePoints.map((p: any) => p.y);

            result.x = Math.min(...xs);
            result.y = Math.min(...ys);
            result.width = Math.max(...xs) - result.x;
            result.height = Math.max(...ys) - result.y;

            result.angle = 0;
            result.originalPoints = absolutePoints;

            result.scaleX = 1;
            result.scaleY = 1;
            result.skewX = 0;
            result.skewY = 0;

        } else {
            result.type = 'aabb';

            const rawX = obj.originalX ?? obj.left;
            const rawY = obj.originalY ?? obj.top;

            result.x = Math.round(rawX);
            result.y = Math.round(rawY);

            result.width = obj.width;
            result.height = obj.height;
            result.scaleX = obj.scaleX || 1; // 保留原始缩放比例
            result.scaleY = obj.scaleY || 1;

            result.angle = 0;
            result.skewX = 0;
            result.skewY = 0;

            result.originalPoints = null;
        }

        return result;
    });
}

function colorForId(id: string | number) {
    const str = String(id || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++)
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

function onMouseDown(opt: any) {
    if (!canvas) return;

    const evt = opt.e;

    const target = canvas.findTarget(evt, false);

    const isMiddleClick = evt.button === 1;

    const isPanKey = evt.altKey || isMiddleClick;

    if (isPanKey || (!addMode.value && !target)) {
        if (isMiddleClick) {
            evt.preventDefault();
            evt.stopPropagation();
        }

        isDragging = true;
        canvas.selection = false; // 拖拽时禁用框选
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        canvas.defaultCursor = 'grabbing'; // 改变光标

        const activeObj = canvas.getActiveObject();
        if (activeObj) {
            activeObj.lockMovementX = true;
            activeObj.lockMovementY = true;
        }

        return;
    }

    if (isCurrentSaved.value) {
        return;
    }

    if (target && ((target as any).isAnnot || target.type === 'group' || target.type === 'activeselection')) {
        const currentImage = images.value[currentImageIndex.value];
        if (currentImage) {
            dragStartState.value = JSON.parse(JSON.stringify(currentImage.res || []));
        }
    } else {
        dragStartState.value = null;
    }

    // 如果不是添加模式，直接返回
    if (!addMode.value) return;

    if (target) {
        if ((target as any).isAnnot) return;
        if (target.type === 'group' || target.type === 'activeselection') return;
        const activeObj = canvas.getActiveObject();
        if (activeObj && (activeObj.type === 'group' || activeObj.type === 'activeselection')) return;
    }

    const pointer = canvas.getPointer(opt.e);
    drawing.value = true;
    startPoint.x = pointer.x;
    startPoint.y = pointer.y;

    const rawLabel = currentLabel.value || "";
    const trimmedLabel = rawLabel.trim();

    // 创建矩形对象
    const rect = new fabric.Rect({
        left: startPoint.x,
        top: startPoint.y,
        originX: "left",
        originY: "top",
        width: 0,
        height: 0,
        fill: "rgba(0,0,0,0.0)",
        stroke: trimmedLabel ? colorForId(trimmedLabel) : "#00aaff",
        strokeWidth: 2,
        selectable: false,
        evented: false,
        hasRotatingPoint: true,
        strokeUniform: true,
    });

    tempRect.rect = rect;
}

function onMouseMove(opt: any) {
    if (!canvas) return;

    if (isDragging) {
        const e = opt.e;
        const vpt = canvas.viewportTransform;
        // 加上判空更安全
        if (vpt) {
            vpt[4] += e.clientX - lastPosX;
            vpt[5] += e.clientY - lastPosY;

            const activeObj = canvas.getActiveObject();
            if (activeObj) {
                activeObj.setCoords();
            }

            canvas.requestRenderAll();
            lastPosX = e.clientX;
            lastPosY = e.clientY;
        }
        return;
    }

    if (!drawing.value || !tempRect.rect) return;

    const pointer = canvas.getPointer(opt.e);
    const x = Math.min(pointer.x, startPoint.x);
    const y = Math.min(pointer.y, startPoint.y);
    const w = Math.abs(pointer.x - startPoint.x);
    const h = Math.abs(pointer.y - startPoint.y);

    tempRect.rect.set({
        left: x,
        top: y,
        width: w,
        height: h,
    });

    const ctx = canvas.contextTop;

    canvas.clearContext(ctx);

    ctx.save();

    const vpt = canvas.viewportTransform;
    if (vpt) {
        ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
    }

    tempRect.rect.render(ctx);

    ctx.restore();
}

function onMouseUp() {
    if (!canvas) return;

    if (isDragging) {
        isDragging = false;
        canvas.setViewportTransform(canvas.viewportTransform!);
        canvas.selection = true; // 恢复框选
        canvas.defaultCursor = 'default';

        const activeObj = canvas.getActiveObject();
        if (activeObj) {
            const shouldLock = isCurrentSaved.value;
            activeObj.lockMovementX = shouldLock;
            activeObj.lockMovementY = shouldLock;
        }

        return;
    }

    if (!drawing.value) return;
    drawing.value = false;
    const drawingRect = tempRect.rect;
    if (!drawingRect) return;

    canvas.clearContext(canvas.contextTop);

    tempRect.rect = undefined;

    const finalProps = {
        left: drawingRect.left,
        top: drawingRect.top,
        width: drawingRect.width,
        height: drawingRect.height,
    };

    if (finalProps.width < 5 || finalProps.height < 5) {
        return;
    }

    requestAnimationFrame(() => {
        if (!canvas) return;

        commitHistory();

        const rawLabel = currentLabel.value || "unknown";
        const labelText = rawLabel.trim() || "unknown"; // 如果全是空格，也回退到 unknown
        const color = colorForId(currentLabel.value || "unknown");
        const objId = "obj_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

        const newFinalRect = new fabric.Rect({
            ...finalProps,
            selectable: true,
            stroke: color,
            strokeWidth: 2,
            fill: "transparent",
            strokeUniform: true,
            cornerStyle: 'circle',
            cornerColor: color,
            cornerSize: 10,
            transparentCorners: false,
            borderColor: color,
            borderScaleFactor: 2,
            borderDashArray: [5, 5],
            isAnnot: true,
            object_id: objId,
            label: labelText,
            color: color,
            originalX: finalProps.left,
            originalY: finalProps.top,
            originalWidth: finalProps.width,
            originalHeight: finalProps.height,
            originalAngle: 0,
        });

        canvas.add(newFinalRect);

        const safePos = getSafeLabelPosition(newFinalRect);
        const text = new fabric.Text(labelText, {
            left: safePos.left,
            top: safePos.top,
            fontSize: 14,
            fill: color,
            selectable: false,
            evented: false,
            isLabel: true,
            parentId: objId,
        });
        canvas.add(text);
        addDirectionIndicator(newFinalRect);

        const boxInfo = {
            id: objId, object_id: objId, label: labelText, color: color,
            x: finalProps.left, y: finalProps.top, w: finalProps.width, h: finalProps.height, angle: 0,
            points: [{ x: finalProps.left, y: finalProps.top }, { x: finalProps.left + finalProps.width, y: finalProps.top + finalProps.height }]
        };
        boxes.value.push(boxInfo);

        const currentImage = images.value[currentImageIndex.value];
        if (currentImage) {
            currentImage.res.push({
                type: "aabb", x: finalProps.left, y: finalProps.top, width: finalProps.width, height: finalProps.height, angle: 0,
                object_id: objId, label: labelText, color: color,
            });
        }

        canvas.setActiveObject(newFinalRect);
        selectedBox.value = { ...boxInfo, fabricObj: newFinalRect };
        selectedLabelEdit.value = labelText;

        canvas.renderAll();
    });
}

function onSelectionChanged(e: any) {
    const activeObj = canvas?.getActiveObject();

    if (canvas) {
        canvas.getObjects().forEach((o: any) => {
            if (o.isDirectionIndicator) {
                o.set({
                    visible: false,
                    scaleX: 1,
                    scaleY: 1,
                    opacity: 1,
                    shadow: null,
                });
            }
            if (o.isLabel) {
                o.set({
                    backgroundColor: 'transparent',
                    stroke: null,
                    strokeWidth: 0,
                    fontWeight: 'normal',
                });
            }
        });
    }

    if (activeObj && (activeObj.type === 'group' || activeObj.type === 'activeselection')) {

        let objects: any[] = [];
        if ('getObjects' in activeObj && typeof activeObj.getObjects === 'function') {
            objects = activeObj.getObjects();
        } else if ('_objects' in activeObj && Array.isArray((activeObj as any)._objects)) {
            objects = (activeObj as any)._objects;
        }

        objects.forEach((child: any) => {
            if (!child.isAnnot) return;

            const textObj = canvas!.getObjects().find((o: any) =>
                o.isLabel && o.parentId === child.object_id
            );

            if (textObj) {
                canvas!.bringObjectToFront(textObj);
                textObj.set({
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    stroke: child.color || '#000',
                    strokeWidth: 1,
                    fontWeight: 'bold',
                });
            }

            const indicator = canvas!.getObjects().find((o: any) =>
                o.isDirectionIndicator && o.parentId === child.object_id
            );

            if (indicator) {
                canvas!.bringObjectToFront(indicator);
                indicator.set({
                    visible: true,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    opacity: 1,
                    shadow: new fabric.Shadow({
                        color: child.color || '#4A90E2',
                        blur: 10,
                        offsetX: 0,
                        offsetY: 0,
                    }),
                });
            }

            const idx = boxes.value.findIndex(b => b.object_id === child.object_id);
            if (idx >= 0) {
            }
        });

        selectedBox.value = {
            isGroup: true,
            objects: objects.filter((o: any) => o.isAnnot).map((o: any) => o.object_id),
        };
        selectedLabelEdit.value = '';

        canvas!.renderAll();
        return;
    }

    const obj = e.selected && e.selected[0];

    if (!obj) {
        selectedBox.value = null;
        selectedLabelEdit.value = "";
        canvas?.renderAll();
        return;
    }

    if (!(obj as any).isAnnot) {
        selectedBox.value = null;
        selectedLabelEdit.value = "";
        canvas?.renderAll();
        return;
    }

    const canvasObjects = canvas?.getObjects().filter((o) => (o as any).isAnnot);
    if (!canvasObjects?.some((o) => (o as any).object_id === (obj as any).object_id)) {
        boxes.value = boxes.value.filter(
            (b) => b.object_id !== (obj as any).object_id,
        );
        selectedBox.value = null;
        selectedLabelEdit.value = "";
        canvas?.renderAll();
        return;
    }

    // 计算坐标
    let points = [];
    let actualX, actualY, actualWidth, actualHeight;

    if (obj.type === 'polygon' && obj.originalPoints) {
        points = obj.originalPoints;
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        actualX = Math.min(...xs);
        actualY = Math.min(...ys);
        actualWidth = Math.max(...xs) - actualX;
        actualHeight = Math.max(...ys) - actualY;
    } else if (obj.angle && obj.angle !== 0) {
        const coords = obj.getCoords(true);
        points = coords.map((p) => ({
            x: Math.round(p.x),
            y: Math.round(p.y),
        }));
        actualX = obj.left;
        actualY = obj.top;
        actualWidth = obj.width * obj.scaleX;
        actualHeight = obj.height * obj.scaleY;
    } else {
        const bbox = obj.getBoundingRect();
        points = [
            { x: bbox.left, y: bbox.top },
            { x: bbox.left + bbox.width, y: bbox.top + bbox.height },
        ];
        actualX = obj.left;
        actualY = obj.top;
        actualWidth = obj.width * obj.scaleX;
        actualHeight = obj.height * obj.scaleY;
    }

    // 同步 selectedBox
    selectedBox.value = {
        id: (obj as any).object_id,
        object_id: (obj as any).object_id,
        label: (obj as any).label,
        color: (obj as any).color,
        x: obj.originalX || actualX,
        y: obj.originalY || actualY,
        w: obj.originalWidth || actualWidth,
        h: obj.originalHeight || actualHeight,
        angle: obj.originalAngle || obj.angle || 0,
        points,
        originalPoints: obj.originalPoints || null,
        fabricObj: obj,
        isGroup: false,
    };
    selectedLabelEdit.value = (obj as any).label;

    if (canvas) {
        if (!isSelecting.value) {
            // 临时设置标志位
            isSelecting.value = true;

            // 使用 bringToFront() 提升到顶层
            canvas.bringObjectToFront(obj);

            // 找到对应的 label 并提升到顶层
            const textObj = canvas.getObjects().find((o: any) =>
                o.isLabel && o.parentId === obj.object_id
            );

            if (textObj) {
                canvas.bringObjectToFront(textObj);

                // 高亮 label
                textObj.set({
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    stroke: obj.color || '#000',
                    strokeWidth: 1,
                    fontWeight: 'bold',
                });
            }

            const indicator = canvas.getObjects().find((o: any) =>
                o.isDirectionIndicator && o.parentId === obj.object_id
            );

            if (indicator) {
                // 提升到顶层
                canvas.bringObjectToFront(indicator);

                // 高亮显示（放大 + 增加不透明度 + 添加发光效果）
                indicator.set({
                    visible: true,
                    scaleX: 1.5,  // 放大 1.5 倍
                    scaleY: 1.5,
                    opacity: 1,
                    shadow: new fabric.Shadow({
                        color: obj.color || '#4A90E2',
                        blur: 10,
                        offsetX: 0,
                        offsetY: 0,
                    }),
                });
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    isSelecting.value = false;
                    // 再次调整旋转点位置（确保最新）
                    adjustRotationPointPosition({ target: obj });
                });
            });
        } else {
            // 如果是在创建新对象，只高亮 label，不执行 bringToFront
            const textObj = canvas.getObjects().find((o: any) =>
                o.isLabel && o.parentId === obj.object_id
            );

            if (textObj) {
                textObj.set({
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    stroke: obj.color || '#000',
                    strokeWidth: 1,
                    fontWeight: 'bold',
                });
            }

            const indicator = canvas.getObjects().find((o: any) =>
                o.isDirectionIndicator && o.parentId === obj.object_id
            );

            if (indicator) {
                canvas.bringObjectToFront(indicator);

                indicator.set({
                    visible: true,
                    scaleX: 1.5,
                    scaleY: 1.5,
                    opacity: 1,
                    shadow: new fabric.Shadow({
                        color: obj.color || '#4A90E2',
                        blur: 10,
                        offsetX: 0,
                        offsetY: 0,
                    }),
                });
            }
        }
    }

    canvas?.renderAll();
}

function getSafeLabelPosition(obj: any, estimatedLabelWidth: number = 100, labelHeight: number = 20) {
    if (!canvas) return { left: 5, top: 5 };

    let limitWidth = canvas.getWidth();
    let limitHeight = canvas.getHeight();

    if (canvas.backgroundImage && (canvas.backgroundImage as any).width) {
        limitWidth = (canvas.backgroundImage as any).width;
        limitHeight = (canvas.backgroundImage as any).height;
    }

    const label = obj.label || '';
    const actualLabelWidth = Math.max(50, Math.min(label.length * 8 + 20, 200));

    let corners: any[] = [];

    if (obj.type === 'polygon') {
        const matrix = obj.calcTransformMatrix();
        corners = obj.get('points').map((p: any) => {
            const point = new fabric.Point(p.x, p.y);
            const transformed = fabric.util.transformPoint(point, matrix);
            return { x: transformed.x, y: transformed.y };
        });
    } else {
        corners = obj.getCoords(true).map((p: any) => ({
            x: p.x,
            y: p.y
        }));
    }

    // 找到最上方的点（y 值最小）
    const topPoint = corners.reduce((min, p) => (p.y < min.y ? p : min), corners[0]);

    // 初始位置：在最上方的点上方
    let left = topPoint.x + 5;
    let top = topPoint.y - 18;

    if (left < 5) {
        left = 5;
    }

    if (left + actualLabelWidth > limitWidth - 5) {
        left = Math.max(5, limitWidth - actualLabelWidth - 5);

        if (left < 5) {
            left = 5;
        }
    }

    if (top < 5) {
        // 上方放不下，尝试放在右侧
        const leftPoint = corners.reduce((min, p) => (p.x < min.x ? p : min), corners[0]);
        left = leftPoint.x - actualLabelWidth - 5;
        top = leftPoint.y + 5;

        // 左侧也放不下，放在框内顶部
        if (left < 5) {
            left = topPoint.x + 5;
            top = topPoint.y + 5;

            // 再次检查右边界
            if (left + actualLabelWidth > limitWidth - 5) {
                left = Math.max(5, limitWidth - actualLabelWidth - 5);
            }
        }
    }

    if (top + labelHeight > limitHeight - 5) {
        top = Math.max(5, limitHeight - labelHeight - 5);
    }

    left = Math.max(5, Math.min(left, limitWidth - actualLabelWidth - 5));
    top = Math.max(5, Math.min(top, limitHeight - labelHeight - 5));

    return { left, top };
}

function updateObjectRealtime(obj: any) {
    if (!obj || !(obj as any).isAnnot) return;

    let points = [];
    let actualX, actualY, actualWidth, actualHeight, actualAngle;

    if (obj.type === 'polygon') {
        const matrix = obj.calcTransformMatrix();
        const absolutePoints = obj.get('points').map((p) => {
            const point = new fabric.Point(p.x, p.y);
            const transformed = fabric.util.transformPoint(point, matrix);
            return {
                x: Math.round(transformed.x),
                y: Math.round(transformed.y)
            };
        });

        points = absolutePoints;
        obj.originalPoints = absolutePoints;

        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        actualX = Math.min(...xs);
        actualY = Math.min(...ys);
        actualWidth = Math.max(...xs) - actualX;
        actualHeight = Math.max(...ys) - actualY;
        actualAngle = 0;

        obj.originalX = actualX;
        obj.originalY = actualY;
        obj.originalWidth = actualWidth;
        obj.originalHeight = actualHeight;
        obj.originalAngle = 0;

    } else {
        actualX = obj.left;
        actualY = obj.top;
        actualWidth = obj.width * obj.scaleX;
        actualHeight = obj.height * obj.scaleY;
        actualAngle = obj.angle || 0;

        const hasTransform = Math.abs(obj.angle || 0) > 0.01 || Math.abs(obj.skewX || 0) > 0.01 || Math.abs(obj.skewY || 0) > 0.01;

        if (hasTransform) {
            const matrix = obj.calcTransformMatrix();
            const halfW = obj.width / 2;
            const halfH = obj.height / 2;
            const localCorners = [
                new fabric.Point(-halfW, -halfH),
                new fabric.Point(halfW, -halfH),
                new fabric.Point(halfW, halfH),
                new fabric.Point(-halfW, halfH)
            ];
            points = localCorners.map(p => {
                const pt = fabric.util.transformPoint(p, matrix);
                return { x: Math.round(pt.x), y: Math.round(pt.y) };
            });

            obj.originalPoints = points;
        } else {
            points = [
                { x: Math.round(actualX), y: Math.round(actualY) },
                { x: Math.round(actualX + actualWidth), y: Math.round(actualY + actualHeight) },
            ];
            obj.originalPoints = null;
        }
    }

    // 使用安全位置更新 label
    const textObj = canvas.getObjects().find((o: any) =>
        o.isLabel && o.parentId === obj.object_id
    );

    if (textObj) {
        const safePos = getSafeLabelPosition(obj);

        textObj.set({
            left: safePos.left,
            top: safePos.top
        });
    }

    const indicator = canvas.getObjects().find((o: any) =>
        o.isDirectionIndicator && o.parentId === obj.object_id
    );

    if (indicator) {
        let centerX, centerY, indicatorAngle;

        if (obj.type === 'polygon') {
            centerX = obj.left;
            centerY = obj.top;

            if (obj.originalPoints && obj.originalPoints.length >= 2) {
                const topLeft = obj.originalPoints[0];
                const topRight = obj.originalPoints[1];

                const dx = topRight.x - topLeft.x;
                const dy = topRight.y - topLeft.y;

                const topEdgeAngle = Math.atan2(dy, dx) * 180 / Math.PI;
                indicatorAngle = topEdgeAngle;

                while (indicatorAngle > 180) indicatorAngle -= 360;
                while (indicatorAngle < -180) indicatorAngle += 360;
            } else {
                indicatorAngle = 0;
            }
        } else {
            const coords = obj.getCoords(true);
            centerX = (coords[0].x + coords[1].x + coords[2].x + coords[3].x) / 4;
            centerY = (coords[0].y + coords[1].y + coords[2].y + coords[3].y) / 4;

            indicatorAngle = (obj.angle || 0);
        }

        indicator.set({
            left: centerX,
            top: centerY,
            angle: indicatorAngle,
        });
    }

    const id = obj.object_id;
    const idx = boxes.value.findIndex(b => b.object_id === id);

    const boxInfo = {
        id,
        object_id: id,
        label: obj.label,
        color: obj.color,
        x: actualX,
        y: actualY,
        w: actualWidth,
        h: actualHeight,
        angle: actualAngle,
        points,
        originalPoints: obj.originalPoints,
        type: (obj.type === 'polygon' || (Math.abs(actualAngle) > 0.01)) ? 'obb' : 'aabb'
    };

    if (idx >= 0) {
        boxes.value[idx] = boxInfo;
    }

    if (selectedBox.value && selectedBox.value.object_id === id) {
        selectedBox.value = { ...boxInfo, fabricObj: obj };
    }

    canvas.renderAll();
}

function onObjectMoving(e: any) {
    updateObjectRealtime(e.target);
}

function onObjectScaling(e: any) {
    updateObjectRealtime(e.target);
}

function onObjectRotating(e: any) {
    updateObjectRealtime(e.target);
}

function handleGroupRealtime(obj: any) {
    if (!canvas) return;

    let objects: any[] = [];
    if ('getObjects' in obj && typeof obj.getObjects === 'function') {
        objects = obj.getObjects();
    } else if ('_objects' in obj && Array.isArray((obj as any)._objects)) {
        objects = (obj as any)._objects;
    }

    if (objects.length === 0) return;

    const groupScaleX = obj.scaleX || 1;
    const groupScaleY = obj.scaleY || 1;
    const isPureMoveOrScale = Math.abs(obj.angle || 0) < 0.001;

    const globalTransforms: any[] = [];

    objects.forEach((child: any) => {
        if (!child.isAnnot) return;

        const matrix = child.calcTransformMatrix();

        if (child.type === 'polygon') {
            // === 多边形处理（与 object:modified 一致）===
            const absolutePoints = child.get('points').map((p: any) => {
                const point = new fabric.Point(p.x, p.y);
                return fabric.util.transformPoint(point, matrix);
            });

            const xs = absolutePoints.map(p => p.x);
            const ys = absolutePoints.map(p => p.y);
            const decomposed = fabric.util.qrDecompose(matrix);

            globalTransforms.push({
                object_id: child.object_id,
                type: 'polygon',
                x: Math.min(...xs),
                y: Math.min(...ys),
                width: Math.max(...xs) - Math.min(...xs),
                height: Math.max(...ys) - Math.min(...ys),
                angle: 0,
                originalPoints: absolutePoints,
                centerX: decomposed.translateX,
                centerY: decomposed.translateY,
            });

        } else {
            // === 矩形处理（与 object:modified 完全一致）===
            const halfW = child.width / 2;
            const halfH = child.height / 2;
            const localCorners = [
                new fabric.Point(-halfW, -halfH),
                new fabric.Point(halfW, -halfH),
                new fabric.Point(halfW, halfH),
                new fabric.Point(-halfW, halfH)
            ];

            const realPoints = localCorners.map(p => {
                const transP = fabric.util.transformPoint(p, matrix);
                return { x: Math.round(transP.x), y: Math.round(transP.y) };
            });

            const decomposed = fabric.util.qrDecompose(matrix);
            const newCenter = new fabric.Point(decomposed.translateX, decomposed.translateY);

            let finalLeft, finalTop, finalActualWidth, finalActualHeight;
            const frozenPos = frozenChildPositions.get(child.object_id);

            if (isPureMoveOrScale && frozenPos) {
                const isPureMove = Math.abs(groupScaleX - 1) < 0.001 && Math.abs(groupScaleY - 1) < 0.001;

                if (isPureMove) {
                    const deltaX = (obj.left || 0) - groupStartLeft;
                    const deltaY = (obj.top || 0) - groupStartTop;
                    finalLeft = frozenPos.x + deltaX;
                    finalTop = frozenPos.y + deltaY;
                    finalActualWidth = frozenPos.w;
                    finalActualHeight = frozenPos.h;
                } else {
                    const frozenCenterX = frozenPos.x + frozenPos.w / 2;
                    const frozenCenterY = frozenPos.y + frozenPos.h / 2;

                    const offsetX = frozenCenterX - groupStartLeft;
                    const offsetY = frozenCenterY - groupStartTop;

                    const scaledOffsetX = offsetX * groupScaleX;
                    const scaledOffsetY = offsetY * groupScaleY;

                    const newCenterX = (obj.left || 0) + scaledOffsetX;
                    const newCenterY = (obj.top || 0) + scaledOffsetY;

                    finalActualWidth = frozenPos.w * groupScaleX;
                    finalActualHeight = frozenPos.h * groupScaleY;

                    finalLeft = newCenterX - finalActualWidth / 2;
                    finalTop = newCenterY - finalActualHeight / 2;
                }
            } else {
                const newTopLeft = fabric.util.transformPoint(
                    new fabric.Point(-child.width / 2, -child.height / 2),
                    matrix
                );
                finalLeft = newTopLeft.x;
                finalTop = newTopLeft.y;
                finalActualWidth = child.width * decomposed.scaleX;
                finalActualHeight = child.height * decomposed.scaleY;
            }

            globalTransforms.push({
                object_id: child.object_id,
                type: 'aabb',
                left: finalLeft,
                top: finalTop,
                width: child.width,
                height: child.height,
                scaleX: decomposed.scaleX,
                scaleY: decomposed.scaleY,
                skewX: decomposed.skewX,
                skewY: decomposed.skewY || 0,
                angle: decomposed.angle,
                actualWidth: finalActualWidth,
                actualHeight: finalActualHeight,
                originalPoints: realPoints,
                centerX: newCenter.x,
                centerY: newCenter.y,
            });
        }
    });

    objects.forEach((child: any) => {
        if (!child.isAnnot) return;
        const transform = globalTransforms.find(t => t.object_id === child.object_id);
        if (!transform) return;

        if (child.type === 'polygon') {
            child.originalX = transform.x;
            child.originalY = transform.y;
            child.originalWidth = transform.width;
            child.originalHeight = transform.height;
            child.originalPoints = transform.originalPoints;
            child.originalAngle = 0;
        } else {
            child.originalX = transform.left;
            child.originalY = transform.top;
            child.originalWidth = transform.actualWidth;
            child.originalHeight = transform.actualHeight;
            child.originalAngle = transform.angle;
            child.originalScaleX = transform.scaleX;
            child.originalScaleY = transform.scaleY;
            child.originalSkewX = transform.skewX;
            child.originalSkewY = transform.skewY;
            child.originalPoints = transform.originalPoints;
        }

        // 更新 label
        const textObj = canvas!.getObjects().find((o: any) =>
            o.isLabel && o.parentId === child.object_id
        );
        if (textObj) {
            const safePos = getSafeLabelPosition(child);
            textObj.set({ left: safePos.left, top: safePos.top });
        }

        // 更新方向指示器
        const indicator = canvas!.getObjects().find((o: any) =>
            o.isDirectionIndicator && o.parentId === child.object_id
        );
        if (indicator) {
            let indicatorAngle = transform.angle || 0;
            if (child.type === 'polygon' && transform.originalPoints && transform.originalPoints.length >= 2) {
                const topLeft = transform.originalPoints[0];
                const topRight = transform.originalPoints[1];
                const dx = topRight.x - topLeft.x;
                const dy = topRight.y - topLeft.y;
                indicatorAngle = Math.atan2(dy, dx) * 180 / Math.PI;
            }
            indicator.set({ left: transform.centerX, top: transform.centerY, angle: indicatorAngle });
        }

        // 更新 boxes.value
        const idx = boxes.value.findIndex(b => b.object_id === child.object_id);
        if (idx >= 0) {
            let finalPoints = [];
            let finalOriginalPoints = null;

            const isTransformed = Math.abs(transform.angle) > 0.01 ||
                Math.abs(transform.skewX) > 0.01 ||
                Math.abs(transform.skewY) > 0.01;

            if (child.type === 'polygon' || isTransformed) {
                finalPoints = transform.originalPoints;
                finalOriginalPoints = transform.originalPoints;
            } else {
                const x = Math.round(child.originalX);
                const y = Math.round(child.originalY);
                const w = Math.round(child.originalWidth);
                const h = Math.round(child.originalHeight);
                finalPoints = [{ x: x, y: y }, { x: x + w, y: y + h }];
            }

            boxes.value[idx] = {
                ...boxes.value[idx],
                x: child.originalX,
                y: child.originalY,
                w: child.originalWidth,
                h: child.originalHeight,
                angle: child.originalAngle || 0,
                points: finalPoints,
                originalPoints: finalOriginalPoints
            };
        }
    });

    // 同步更新 images.value
    const currentImage = images.value[currentImageIndex.value];
    if (currentImage) {
        globalTransforms.forEach((transform) => {
            const resIdx = currentImage.res.findIndex((r: any) => r.object_id === transform.object_id);
            if (resIdx >= 0) {
                if (transform.type === 'polygon') {
                    currentImage.res[resIdx] = {
                        ...currentImage.res[resIdx],
                        type: 'obb',
                        x: transform.x,
                        y: transform.y,
                        width: transform.width,
                        height: transform.height,
                        angle: 0,
                        originalPoints: transform.originalPoints,
                    };
                } else {
                    currentImage.res[resIdx] = {
                        ...currentImage.res[resIdx],
                        type: 'aabb',
                        x: transform.left,
                        y: transform.top,
                        width: transform.width,
                        height: transform.height,
                        scaleX: transform.scaleX,
                        scaleY: transform.scaleY,
                        skewX: transform.skewX,
                        skewY: transform.skewY,
                        angle: transform.angle,
                        originalPoints: transform.originalPoints,
                    };
                }
            }
        });
    }

    canvas!.requestRenderAll();
}

function toggleAddMode() {
    if (images.value.length === 0) {
        ElMessage.warning("暂无图片，无法进行标注");
        return;
    }

    addMode.value = !addMode.value;

    if (addMode.value) {
        ElMessage.info(
            "进入添加模式：拖拽创建矩形，释放后矩形生效，使用旋转控制点旋转",
        );
    }
}

function deleteSelectedBox() {
    if (!canvas) {
        console.warn('Canvas not available');
        return;
    }

    if (isCurrentSaved.value) {
        return;
    }

    if (!selectedBox.value || selectedBox.value === null || selectedBox.value === undefined) {
        console.warn('No selected box to delete');
        ElMessage.warning('请先选中一个矩形框');
        return;
    }

    commitHistory();

    canvas.discardActiveObject();

    try {
        if (selectedBox.value?.isGroup && Array.isArray(selectedBox.value?.objects)) {
            const deletedCount = selectedBox.value.objects.length;

            selectedBox.value.objects.forEach((objectId: string) => {
                const objects = canvas!.getObjects().filter((o) => {
                    if ((o as any).isAnnot && (o as any).object_id === objectId) return true;
                    if ((o as any).isLabel && (o as any).parentId === objectId) return true;
                    if ((o as any).isDirectionIndicator && (o as any).parentId === objectId) return true;
                    return false;
                });

                objects.forEach((o) => canvas!.remove(o));

                // 更新数据
                boxes.value = boxes.value.filter((b) => b.object_id !== objectId);

                const currentImage = images.value[currentImageIndex.value];
                if (currentImage) {
                    currentImage.res = currentImage.res.filter((r: any) => r.object_id !== objectId);
                }
            });

            ElMessage.success(`已删除 ${deletedCount} 个矩形框`);
        } else if (selectedBox.value?.object_id) {
            // 删除单个对象
            const objectId = selectedBox.value.object_id;

            const objects = canvas.getObjects().filter((o) => {
                if ((o as any).isAnnot && (o as any).object_id === objectId) return true;
                if ((o as any).isLabel && (o as any).parentId === objectId) return true;
                if ((o as any).isDirectionIndicator && (o as any).parentId === objectId) return true;
                return false;
            });

            objects.forEach((o) => canvas.remove(o));

            boxes.value = boxes.value.filter((b) => b.object_id !== objectId);

            const currentImage = images.value[currentImageIndex.value];
            if (currentImage) {
                currentImage.res = currentImage.res.filter((r: any) => r.object_id !== objectId);
            }

            ElMessage.success('已删除矩形框');
        } else {
            console.warn('Invalid selectedBox structure:', selectedBox.value);
            ElMessage.warning('无效的选中对象');
            return;
        }
    } catch (error) {
        console.error('Delete error:', error);
        ElMessage.error('删除失败，请重试');
        return;
    } finally {
        selectedBox.value = null;
        selectedLabelEdit.value = "";

        // 清除所有高亮
        canvas.getObjects().forEach((o: any) => {
            if (o.isLabel) {
                o.set({
                    backgroundColor: 'transparent',
                    stroke: null,
                    strokeWidth: 0,
                    fontWeight: 'normal'
                });
            }
            if (o.isDirectionIndicator) {
                o.set({
                    visible: false,
                    scaleX: 1,
                    scaleY: 1,
                    shadow: null
                });
            }
        });

        canvas.requestRenderAll();
        requestAnimationFrame(() => canvas?.requestRenderAll());
    }
}

function selectBoxFromList(box: any) {
    if (!canvas) return;

    const obj = canvas
        .getObjects()
        .find((o) => (o as any).isAnnot && (o as any).object_id === box.object_id);

    if (obj) {
        canvas.discardActiveObject();

        canvas.setActiveObject(obj);

        let points = [];
        let actualX, actualY, actualWidth, actualHeight;

        if (obj.type === 'polygon' && obj.originalPoints) {
            points = obj.originalPoints;
            const xs = points.map((p: any) => p.x);
            const ys = points.map((p: any) => p.y);
            actualX = Math.min(...xs);
            actualY = Math.min(...ys);
            actualWidth = Math.max(...xs) - actualX;
            actualHeight = Math.max(...ys) - actualY;
        } else {
            actualX = obj.left;
            actualY = obj.top;
            actualWidth = obj.width * (obj.scaleX || 1);
            actualHeight = obj.height * (obj.scaleY || 1);

            // 如果有旋转或倾斜，重新计算四个角点供 UI 显示
            if ((obj.angle && obj.angle !== 0) || (obj.skewX && obj.skewX !== 0)) {
                const coords = obj.getCoords(true);
                points = coords.map((p: any) => ({
                    x: Math.round(p.x),
                    y: Math.round(p.y)
                }));
            } else {
                points = [
                    { x: Math.round(actualX), y: Math.round(actualY) },
                    { x: Math.round(actualX + actualWidth), y: Math.round(actualY + actualHeight) }
                ];
            }
        }

        // 显式赋值给 selectedBox，激活删除按钮和列表加粗
        selectedBox.value = {
            id: (obj as any).object_id,
            object_id: (obj as any).object_id,
            label: (obj as any).label,
            color: (obj as any).color,
            x: (obj as any).originalX || actualX,
            y: (obj as any).originalY || actualY,
            w: (obj as any).originalWidth || actualWidth,
            h: (obj as any).originalHeight || actualHeight,
            angle: (obj as any).originalAngle || obj.angle || 0,
            points: points,
            originalPoints: obj.originalPoints || null,
            fabricObj: obj,
            isGroup: false,
        };
        selectedLabelEdit.value = (obj as any).label;

        canvas.getObjects().forEach((o: any) => {
            if (o.isDirectionIndicator) {
                o.visible = false;
                o.scaleX = 1;
                o.scaleY = 1;
                o.shadow = null;
            }
            if (o.isLabel) {
                o.set({
                    backgroundColor: 'transparent',
                    stroke: null,
                    strokeWidth: 0,
                    fontWeight: 'normal',
                });
            }
        });

        // 高亮当前对象的 Label
        const textObj = canvas.getObjects().find((o: any) =>
            o.isLabel && o.parentId === obj.object_id
        );
        if (textObj) {
            canvas.bringObjectToFront(textObj);
            textObj.set({
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                stroke: obj.color || '#000',
                strokeWidth: 1,
                fontWeight: 'bold',
            });
        }

        // 高亮当前对象的方向指示器
        const indicator = canvas.getObjects().find((o: any) =>
            o.isDirectionIndicator && o.parentId === obj.object_id
        );
        if (indicator) {
            canvas.bringObjectToFront(indicator);
            indicator.set({
                visible: true,
                scaleX: 1.5,
                scaleY: 1.5,
                opacity: 1,
                shadow: new fabric.Shadow({
                    color: obj.color || '#4A90E2',
                    blur: 10,
                    offsetX: 0,
                    offsetY: 0,
                }),
            });
        }

        // 将选中对象置顶
        canvas.bringObjectToFront(obj);

        // 刷新画布
        canvas.renderAll();
    }
}

function applyLabelToSelected() {
    if (!canvas || !selectedBox.value) return;

    if (isCurrentSaved.value) {
        ElMessage.warning("当前图片已保存，无法修改标签");
        return;
    }

    // 获取输入值并去除首尾空格
    const rawLabel = selectedLabelEdit.value;
    if (!rawLabel || !rawLabel.trim()) {
        return; // 如果为空，不执行
    }

    commitHistory();

    const newLabel = rawLabel.trim();

    const newColor = colorForId(newLabel);

    selectedBox.value.label = newLabel;
    if ((selectedBox.value as any).color !== undefined) {
        (selectedBox.value as any).color = newColor;
    }

    const obj = canvas
        .getObjects()
        .find(
            (o) =>
                (o as any).isAnnot &&
                (o as any).object_id === selectedBox.value.object_id,
        );

    if (obj) {
        (obj as any).set({
            label: newLabel,
            color: newColor,
            stroke: newColor,
            borderColor: newColor,
            cornerColor: newColor,
        });

        if ((obj as any).shadow) {
            (obj as any).shadow.color = newColor;
        }

        const relatedObjects = canvas.getObjects().filter((o: any) =>
            o.parentId === (obj as any).object_id
        );

        relatedObjects.forEach((child: any) => {
            if (child.shadow) {
                child.shadow.color = newColor;
            }

            if (child.isLabel) {
                child.set({
                    text: newLabel,
                    fill: newColor,
                    stroke: newColor
                });
            } else {
                child.set({ fill: newColor });
                const oldStroke = (child.stroke || '').toString().toLowerCase();
                const isWhite = oldStroke === 'white' || oldStroke === '#fff' || oldStroke === '#ffffff';

                if (!isWhite) {
                    child.set({ stroke: newColor });
                }
            }
        });
    }

    const idx = boxes.value.findIndex(
        (b) => b.object_id === selectedBox.value.object_id,
    );

    if (idx >= 0) {
        boxes.value[idx].label = newLabel;
        boxes.value[idx].color = newColor;
    }

    const currentImage = images.value[currentImageIndex.value];
    if (currentImage) {
        const resIdx = currentImage.res.findIndex(
            (r: any) => r.object_id === selectedBox.value.object_id
        );
        if (resIdx >= 0) {
            currentImage.res[resIdx].label = newLabel;
            currentImage.res[resIdx].color = newColor;
        }
    }

    if (!labelList.value.includes(newLabel)) {
        labelList.value.push(newLabel);
    }

    canvas.requestRenderAll();
}

function save() {
    if (isCurrentSaved.value) {
        return;
    }
    isLoading.value = true;
    if (!canvas) {
        isLoading.value = false;
        return;
    }

    const currentImage = images.value[currentImageIndex.value];
    if (!currentImage) {
        isLoading.value = false;
        ElMessage.warning("未找到当前图片信息");
        return;
    }

    const labelIdMap = new Map();
    let maxId = 0;

    images.value.forEach(img => {
        if (Array.isArray(img.res)) {
            img.res.forEach(item => {
                const rawIdStr = String(item.object_id).split('_')[0];
                const dbId = parseInt(rawIdStr, 10);
                const label = item.label;

                if (!isNaN(dbId) && label) {
                    if (!labelIdMap.has(label)) {
                        labelIdMap.set(label, dbId);
                    }
                    if (dbId > maxId) maxId = dbId;
                }
            });
        }
    });

    const validObjects = canvas.getObjects().filter((o) => (o as any).isAnnot);

    const currentLabels = new Set(validObjects.map((o: any) => o.label));
    const newLabels = [];

    currentLabels.forEach(label => {
        if (!labelIdMap.has(label)) {
            newLabels.push(label);
        }

        if (label && !labelList.value.includes(label)) {
            labelList.value.push(label);
        }
    });

    labelList.value.sort((a, b) => a.localeCompare(b));

    newLabels.sort((a, b) => a.localeCompare(b));
    newLabels.forEach(label => {
        maxId++;
        labelIdMap.set(label, maxId);
    });

    const groupedMap = new Map();

    const getGeometricPoints = (obj: any) => {
        const center = obj.getCenterPoint();
        const cx = center.x;
        const cy = center.y;

        const w = obj.width * (obj.scaleX || 1);
        const h = obj.height * (obj.scaleY || 1);

        const angle = (obj.angle || 0) * (Math.PI / 180);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const hw = w / 2;
        const hh = h / 2;

        const corners = [
            { x: -hw, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: -hw, y: hh }
        ];

        return corners.map(p => {
            return [
                Math.round(cx + (p.x * cos - p.y * sin)),
                Math.round(cy + (p.x * sin + p.y * cos))
            ];
        });
    };

    validObjects.forEach((o: any) => {
        let points = [];
        let type = "";

        if (o.setCoords) o.setCoords();

        const isRotated = o.angle && (Math.abs(o.angle) % 360 > 0.01);

        if (o.type === 'polygon' && o.originalPoints) {
            type = "obb";
            points = o.originalPoints.map((p: any) => [Math.round(p.x), Math.round(p.y)]);
        }
        else {
            if (isRotated) {
                type = "obb";
                points = getGeometricPoints(o);
            } else {
                type = "aabb";

                let x = o.left;
                let y = o.top;

                if (o.originX === "center") x = o.left - (o.width * (o.scaleX || 1)) / 2;
                if (o.originY === "center") y = o.top - (o.height * (o.scaleY || 1)) / 2;

                const finalX = Math.round(x);
                const finalY = Math.round(y);
                const finalW = Math.round(o.width * (o.scaleX || 1));
                const finalH = Math.round(o.height * (o.scaleY || 1));

                points = [
                    [finalX, finalY],
                    [finalX + finalW, finalY + finalH]
                ];
            }
        }

        const logicalId = labelIdMap.get(o.label);

        if (!groupedMap.has(logicalId)) {
            groupedMap.set(logicalId, {
                label: o.label,
                object_id: logicalId,
                boxes: []
            });
        }

        const group = groupedMap.get(logicalId);
        group.boxes.push({
            rect_id: o.object_id,
            points: points,
            type: type
        });
    });

    const annotationList = Array.from(groupedMap.values());
    annotationList.sort((a, b) => a.object_id - b.object_id);

    const requestParams = {
        imageId: currentImage.id,
        results: annotationList
    };

    const onSuccess = () => {
        ElMessage.success("Save Annotation Success.");

        if (images.value[currentImageIndex.value]) {
            images.value[currentImageIndex.value].isSaved = true;
        }

        if (addMode.value) {
            addMode.value = false;
            drawing.value = false;

            if (canvas) {
                canvas.clearContext(canvas.contextTop);
                tempRect.rect = undefined;
            }
        }

        if (canvas) {
            const objectsToRemove = canvas.getObjects().filter((o: any) =>
                o.isAnnot || o.isLabel || o.isDirectionIndicator
            );
            objectsToRemove.forEach((o) => canvas.remove(o));
        }

        if (currentImage.res) {
            renderResBoxes(currentImage.res);
            updateBoxesFromOriginalData(currentImage.res);
        }

        selectedBox.value = null;
        selectedLabelEdit.value = "";

        canvas?.requestRenderAll();
        isLoading.value = false;
    };

    const onError = (msg) => {
        ElMessage.error(msg || "Save Annotation Error");
        isLoading.value = false;
    };

    emit('save', requestParams, onSuccess, onError);
}

const handleBackClick = () => {
    annotationName.value = "";
    emit("back");
};

function hexToRgba(hex: string, alpha: number) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
        : hex;
}

function getListItemStyle(box: any) {
    const isActive = selectedBox.value?.id === box.id ||
        (selectedBox.value?.isGroup && selectedBox.value?.objects?.includes(box.object_id));

    if (isActive) {
        return {
            backgroundColor: hexToRgba(box.color, 0.12),
            borderColor: box.color,
            borderLeftWidth: '4px',
            borderLeftColor: box.color,
            boxShadow: `inset 0 0 0 1px ${box.color}20`
        };
    } else {
        return {
            borderLeftColor: box.color
        };
    }
}
</script>

<style lang="scss" scoped>
@import "../styles/image-annotator.scss"
</style>
