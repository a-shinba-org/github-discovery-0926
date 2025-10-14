class PhotoSharingApp {
    constructor() {
        this.photos = JSON.parse(localStorage.getItem('photos')) || [];
        this.currentPhotoIndex = -1;
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupEventListeners();
        this.renderGallery();
        this.updatePhotoCount();
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const modal = document.getElementById('photoModal');
        const closeModal = document.getElementById('closeModal');
        const deletePhoto = document.getElementById('deletePhoto');
        const themeToggle = document.getElementById('themeToggle');

        // Theme toggle
        themeToggle.addEventListener('click', () => this.toggleTheme());

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        uploadArea.addEventListener('click', () => fileInput.click());

        // Modal events
        closeModal.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        deletePhoto.addEventListener('click', () => this.deleteCurrentPhoto());

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (modal.style.display === 'block') {
                if (e.key === 'Escape') this.closeModal();
                if (e.key === 'ArrowLeft') this.showPreviousPhoto();
                if (e.key === 'ArrowRight') this.showNextPhoto();
                if (e.key === 'Delete') this.deleteCurrentPhoto();
            }
        });
    }

    applyTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (this.theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (themeToggle) {
                themeToggle.textContent = '☀️';
                themeToggle.setAttribute('aria-label', 'ライトモードに切り替え');
            }
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggle) {
                themeToggle.textContent = '🌙';
                themeToggle.setAttribute('aria-label', 'ダークモードに切り替え');
            }
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        this.handleFileSelect(files);
    }

    handleFileSelect(files) {
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );

        if (imageFiles.length === 0) {
            alert('画像ファイルを選択してください。');
            return;
        }

        imageFiles.forEach(file => {
            this.addPhoto(file);
        });
    }

    addPhoto(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photo = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: this.formatFileSize(file.size),
                uploadDate: new Date().toLocaleString('ja-JP'),
                dataUrl: e.target.result
            };

            this.photos.unshift(photo); // Add to beginning of array
            this.savePhotos();
            this.renderGallery();
            this.updatePhotoCount();
        };
        reader.readAsDataURL(file);
    }

    renderGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        
        if (this.photos.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-state">
                    <span class="emoji">📷</span>
                    <p>まだ写真がありません</p>
                    <p>上のエリアに写真をアップロードしてください</p>
                </div>
            `;
            return;
        }

        galleryGrid.innerHTML = this.photos.map((photo, index) => `
            <div class="photo-item" onclick="app.openModal(${index})">
                <img src="${photo.dataUrl}" alt="${photo.name}" loading="lazy">
                <div class="photo-info">
                    <h3>${photo.name}</h3>
                    <p>${photo.size} • ${photo.uploadDate}</p>
                </div>
            </div>
        `).join('');
    }

    openModal(index) {
        this.currentPhotoIndex = index;
        const photo = this.photos[index];
        const modal = document.getElementById('photoModal');
        const modalImage = document.getElementById('modalImage');
        const modalFileName = document.getElementById('modalFileName');
        const modalFileSize = document.getElementById('modalFileSize');
        const modalUploadDate = document.getElementById('modalUploadDate');

        modalImage.src = photo.dataUrl;
        modalFileName.textContent = `ファイル名: ${photo.name}`;
        modalFileSize.textContent = `ファイルサイズ: ${photo.size}`;
        modalUploadDate.textContent = `アップロード日時: ${photo.uploadDate}`;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('photoModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentPhotoIndex = -1;
    }

    showPreviousPhoto() {
        if (this.currentPhotoIndex > 0) {
            this.openModal(this.currentPhotoIndex - 1);
        }
    }

    showNextPhoto() {
        if (this.currentPhotoIndex < this.photos.length - 1) {
            this.openModal(this.currentPhotoIndex + 1);
        }
    }

    deleteCurrentPhoto() {
        if (this.currentPhotoIndex >= 0) {
            const confirmed = confirm('この写真を削除してもよろしいですか？');
            if (confirmed) {
                this.photos.splice(this.currentPhotoIndex, 1);
                this.savePhotos();
                this.renderGallery();
                this.updatePhotoCount();
                this.closeModal();
            }
        }
    }

    updatePhotoCount() {
        const photoCount = document.getElementById('photoCount');
        photoCount.textContent = this.photos.length;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    savePhotos() {
        localStorage.setItem('photos', JSON.stringify(this.photos));
    }

    // Public methods for debugging or external access
    clearAllPhotos() {
        const confirmed = confirm('すべての写真を削除してもよろしいですか？この操作は取り消せません。');
        if (confirmed) {
            this.photos = [];
            this.savePhotos();
            this.renderGallery();
            this.updatePhotoCount();
            this.closeModal();
        }
    }

    exportPhotos() {
        const data = JSON.stringify(this.photos, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'photos_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PhotoSharingApp();
});

// Add some helpful console messages for developers
console.log('📸 Photo Sharing App loaded!');
console.log('Available methods:');
console.log('- app.clearAllPhotos() - Clear all photos');
console.log('- app.exportPhotos() - Export photos as JSON');