// Enhanced JonahTube Video Upload and Recording System
class JonahTubeCreator {
  constructor() {
    this.currentMode = 'selection'; // selection, upload, record
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.recordingTimer = null;
    this.recordingStartTime = null;
    this.recordedBlob = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupThemeToggle();
    this.setupNotifications();
    this.setupContentModeration();
  }

  setupEventListeners() {
    // Creation option selection
    document.querySelectorAll('.option-card').forEach(card => {
      card.addEventListener('click', () => {
        const option = card.dataset.option;
        this.selectCreationOption(option);
      });
    });

    // Back to options buttons
    document.getElementById('back-to-options')?.addEventListener('click', () => {
      this.showCreationOptions();
    });
    document.getElementById('back-to-options-record')?.addEventListener('click', () => {
      this.showCreationOptions();
    });

    // Upload form functionality
    this.setupUploadForm();
    
    // Recording functionality
    this.setupRecordingControls();
    
    // Tab switching
    this.setupTabSwitching();
  }

  setupUploadForm() {
    // Upload method selection
    document.querySelectorAll('[data-method]').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('[data-method]').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        
        const method = option.dataset.method;
        this.toggleUploadMethod(method);
      });
    });

    // File upload
    const fileInput = document.getElementById('video-file');
    const uploadArea = document.getElementById('file-upload-area');
    const uploadBtn = uploadArea?.querySelector('.upload-btn');

    uploadBtn?.addEventListener('click', () => fileInput?.click());
    
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleFileUpload(file);
    });

    // Drag and drop
    uploadArea?.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea?.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        this.handleFileUpload(file);
      }
    });

    // URL input
    const urlInput = document.getElementById('video-url');
    urlInput?.addEventListener('input', () => this.handleUrlInput());

    // Character counters
    this.setupCharacterCounters();

    // Visibility options
    this.setupVisibilityOptions();

    // Form submission
    document.getElementById('upload-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmission();
    });
  }

  setupRecordingControls() {
    const startCameraBtn = document.getElementById('start-camera');
    const recordBtn = document.getElementById('record-button');
    const stopBtn = document.getElementById('stop-recording');
    const publishBtn = document.getElementById('publish-recording');

    startCameraBtn?.addEventListener('click', () => this.startCamera());
    recordBtn?.addEventListener('click', () => this.toggleRecording());
    stopBtn?.addEventListener('click', () => this.stopRecording());
    publishBtn?.addEventListener('click', () => this.publishRecording());

    // Recording form character counters
    this.setupRecordingCharacterCounters();
  }

  setupTabSwitching() {
    document.querySelectorAll('.upload-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        const parentCard = tab.closest('.upload-card');
        
        // Update active tab
        parentCard.querySelectorAll('.upload-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding content
        parentCard.querySelectorAll('.tab-content').forEach(content => {
          content.style.display = 'none';
        });
        parentCard.querySelector(`#${tabName}-tab`).style.display = 'block';
      });
    });
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.textContent = '☀️';
    }

    themeToggle?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const newTheme = current === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
  }

  setupNotifications() {
    const notifBell = document.getElementById("notification-bell");
    const notifDot = document.getElementById("notif-dot");
    const hasRead = localStorage.getItem("readGuidelines");

    if (hasRead === "true") {
      notifDot.style.display = "none";
    }

    notifBell?.addEventListener("click", () => {
      window.location.href = "guidelines.html";
    });
  }

  setupContentModeration() {
    // Setup real-time content validation
    this.setupContentValidator('video-title', 'title-validation', 'video-title');
    this.setupContentValidator('video-description', 'description-validation', 'video-description');
    this.setupContentValidator('record-title', 'record-title-validation', 'video-title');
    this.setupContentValidator('record-description', 'record-description-validation', 'video-description');
  }

  setupContentValidator(inputId, validationId, contentType) {
    const input = document.getElementById(inputId);
    const validation = document.getElementById(validationId);

    if (!input || !validation) return;

    input.addEventListener('input', () => {
      this.validateContent(inputId);
    });

    input.addEventListener('blur', () => {
      this.validateContent(inputId);
    });
  }

  validateContent(inputId) {
    const input = document.getElementById(inputId);
    const validationEl = document.getElementById(inputId.replace(/^(video-|record-)/, '') + '-validation');

    if (!input || !validationEl) return;

    const content = input.value;
    const contentType = inputId.includes('title') ? 'video-title' : 'video-description';

    // Use the global content moderation system
    const result = window.ContentModeration.checkContent(content, contentType);

    // Update input styling
    input.classList.remove('blocked-content');

    // Update validation display
    validationEl.classList.remove('show', 'error', 'warning', 'success');

    if (!result.isAppropriate) {
      input.classList.add('blocked-content');
      validationEl.classList.add('show', 'error');

      let message = '❌ Content not allowed: ';
      if (result.blockedWords.length > 0) {
        message += 'Contains inappropriate words: ' + result.blockedWords.join(', ');
      } else if (result.suspiciousPatterns.length > 0) {
        message += 'Contains inappropriate patterns';
      } else {
        message += result.issues[0];
      }

      validationEl.innerHTML = '<div>' + message + '</div>' +
        (result.suggestions.length > 0 ? '<div class="moderation-suggestions show"><strong>Suggestions:</strong><ul>' + result.suggestions.map(s => '<li>' + s + '</li>').join('') + '</ul></div>' : '');
    } else if (result.issues.length > 0) {
      validationEl.classList.add('show', 'warning');
      validationEl.innerHTML = '⚠️ ' + result.issues.join(', ');
    } else if (content.length > 10) {
      const score = window.ContentModeration.getContentSafetyScore(content);
      if (score >= 80) {
        validationEl.classList.add('show', 'success');
        validationEl.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;"><div class="safety-indicator safe"></div><span>✅ Content approved (Safety Score: ' + score + '/100)</span></div>';
      }
    }

    // Check if suggested clean content is available
    if (!result.isAppropriate && content.length > 0) {
      const cleanContent = window.ContentModeration.suggestCleanContent(content);
      if (cleanContent !== content) {
        const suggestionEl = document.createElement('div');
        suggestionEl.className = 'moderation-suggestions show';
        suggestionEl.innerHTML = '<strong>Suggested alternative:</strong><br>"' + cleanContent + '"<button onclick="document.getElementById(\'' + inputId + '\').value=\'' + cleanContent.replace(/'/g, "\\'") + '\'; document.getElementById(\'' + inputId + '\').dispatchEvent(new Event(\'input\'));" style="margin-left: 8px; padding: 4px 8px; background: var(--success-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">Use This</button>';
        validationEl.appendChild(suggestionEl);
      }
    }
  }

  selectCreationOption(option) {
    this.currentMode = option;
    document.getElementById('creation-options').style.display = 'none';
    
    if (option === 'upload') {
      document.getElementById('upload-card').classList.add('active');
    } else if (option === 'record') {
      document.getElementById('record-card').classList.add('active');
    }
  }

  showCreationOptions() {
    this.currentMode = 'selection';
    document.getElementById('creation-options').style.display = 'grid';
    document.getElementById('upload-card').classList.remove('active');
    document.getElementById('record-card').classList.remove('active');
    
    // Clean up recording resources
    this.cleanupRecording();
  }

  toggleUploadMethod(method) {
    const urlGroup = document.getElementById('url-input-group');
    const fileGroup = document.getElementById('file-input-group');
    
    if (method === 'url') {
      urlGroup.style.display = 'block';
      fileGroup.style.display = 'none';
    } else {
      urlGroup.style.display = 'none';
      fileGroup.style.display = 'block';
    }
    
    this.checkFormValidity();
  }

  handleFileUpload(file) {
    const uploadArea = document.getElementById('file-upload-area');
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    
    if (file.size > maxSize) {
      this.showNotification('File size too large. Maximum size is 2GB.', 'error');
      return;
    }

    if (!file.type.startsWith('video/')) {
      this.showNotification('Please select a valid video file.', 'error');
      return;
    }

    uploadArea.classList.add('has-file');
    uploadArea.querySelector('.upload-text').textContent = `Selected: ${file.name}`;
    uploadArea.querySelector('.upload-hint').textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    
    // Auto-generate title from filename
    const titleInput = document.getElementById('video-title');
    if (!titleInput.value) {
      const filename = file.name.replace(/\.[^/.]+$/, "");
      titleInput.value = filename;
      this.updateCharacterCount('video-title', 'title-count', 100);
    }
    
    this.checkFormValidity();
  }

  handleUrlInput() {
    const url = document.getElementById('video-url').value;
    const preview = document.getElementById('url-preview');
    const thumbnail = document.getElementById('preview-thumbnail');
    
    if (url && this.isValidYouTubeUrl(url)) {
      const videoId = this.extractYouTubeID(url);
      if (videoId) {
        thumbnail.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}"></iframe>`;
        preview.classList.add('show');
        
        // Auto-generate title if empty
        const titleInput = document.getElementById('video-title');
        if (!titleInput.value) {
          titleInput.value = `Video ${videoId}`;
          this.updateCharacterCount('video-title', 'title-count', 100);
        }
      }
    } else {
      preview.classList.remove('show');
    }
    
    this.checkFormValidity();
  }

  setupCharacterCounters() {
    this.setupCharacterCounter('video-title', 'title-count', 100);
    this.setupCharacterCounter('video-description', 'description-count', 5000);
  }

  setupRecordingCharacterCounters() {
    this.setupCharacterCounter('record-title', 'record-title-count', 100);
    this.setupCharacterCounter('record-description', 'record-description-count', 5000);
  }

  setupCharacterCounter(inputId, countId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(countId);

    input?.addEventListener('input', () => {
      this.updateCharacterCount(inputId, countId, maxLength);
      this.validateContent(inputId);
      this.checkFormValidity();
    });
  }

  updateCharacterCount(inputId, countId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(countId);
    
    if (!input || !counter) return;
    
    const currentLength = input.value.length;
    counter.textContent = `${currentLength} / ${maxLength}`;
    
    counter.classList.remove('warning', 'error');
    if (currentLength > maxLength * 0.9) {
      counter.classList.add('warning');
    }
    if (currentLength >= maxLength) {
      counter.classList.add('error');
    }
  }

  setupVisibilityOptions() {
    document.querySelectorAll('[data-visibility]').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('[data-visibility]').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
      });
    });
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      const preview = document.getElementById('camera-preview');
      const video = document.createElement('video');
      video.srcObject = this.stream;
      video.autoplay = true;
      video.muted = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      
      preview.innerHTML = '';
      preview.appendChild(video);
      
      const timer = document.createElement('div');
      timer.className = 'recording-timer';
      timer.id = 'recording-timer';
      timer.textContent = '00:00';
      preview.appendChild(timer);
      
      document.getElementById('start-camera').disabled = true;
      document.getElementById('record-button').disabled = false;
      
      this.showNotification('Camera started! Ready to record.', 'success');
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.showNotification('Unable to access camera. Please check permissions.', 'error');
    }
  }

  toggleRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    if (!this.stream) return;
    
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      this.recordedBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
      this.showRecordingPreview();
    };
    
    this.mediaRecorder.start();
    this.recordingStartTime = Date.now();
    
    // Update UI
    const recordBtn = document.getElementById('record-button');
    const timer = document.getElementById('recording-timer');
    
    recordBtn.classList.add('recording');
    recordBtn.textContent = '⏸️';
    timer.classList.add('active');
    
    document.getElementById('stop-recording').disabled = false;
    
    // Start timer
    this.recordingTimer = setInterval(() => {
      const elapsed = Date.now() - this.recordingStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
    
    this.showNotification('Recording started!', 'success');
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    // Update UI
    const recordBtn = document.getElementById('record-button');
    const timer = document.getElementById('recording-timer');
    
    recordBtn.classList.remove('recording');
    recordBtn.textContent = '⚫';
    recordBtn.disabled = true;
    timer.classList.remove('active');
    
    document.getElementById('stop-recording').disabled = true;
    
    // Clear timer
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    this.showNotification('Recording stopped!', 'success');
  }

  showRecordingPreview() {
    const preview = document.getElementById('recorded-preview');
    if (preview && this.recordedBlob) {
      preview.src = URL.createObjectURL(this.recordedBlob);
      
      // Switch to preview tab
      const previewTab = document.querySelector('[data-tab="preview"]');
      if (previewTab) {
        previewTab.click();
      }
      
      document.getElementById('publish-recording').disabled = false;
      
      // Auto-generate title
      const titleInput = document.getElementById('record-title');
      if (!titleInput.value) {
        const now = new Date();
        titleInput.value = `Recording ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        this.updateCharacterCount('record-title', 'record-title-count', 100);
      }
    }
  }

  cleanupRecording() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordedBlob = null;
    
    // Reset UI
    document.getElementById('start-camera').disabled = false;
    document.getElementById('record-button').disabled = true;
    document.getElementById('stop-recording').disabled = true;
    document.getElementById('publish-recording').disabled = true;
  }

  checkFormValidity() {
    const uploadButton = document.getElementById('upload-button');
    if (!uploadButton) return;

    const selectedMethod = document.querySelector('[data-method].selected')?.dataset.method;
    const title = document.getElementById('video-title')?.value;
    let isValid = false;

    if (selectedMethod === 'url') {
      const url = document.getElementById('video-url')?.value;
      isValid = url && title && this.isValidYouTubeUrl(url);
    } else if (selectedMethod === 'file') {
      const fileInput = document.getElementById('video-file');
      isValid = fileInput?.files?.length > 0 && title;
    }

    // Also check content appropriateness
    if (isValid && title.length > 0) {
      const titleResult = window.ContentModeration.checkContent(title, 'video-title');
      const description = document.getElementById('video-description')?.value || '';
      const descriptionResult = window.ContentModeration.checkContent(description, 'video-description');

      isValid = titleResult.isAppropriate && descriptionResult.isAppropriate;
    }

    uploadButton.disabled = !isValid;
  }

  checkContentBeforeSubmission(title, description) {
    // Check title
    const titleResult = window.ContentModeration.checkContent(title, 'video-title');
    if (!titleResult.isAppropriate) {
      return {
        allowed: false,
        field: 'title',
        message: 'Title is not appropriate: ' + titleResult.issues.join(', '),
        suggestions: titleResult.suggestions
      };
    }

    // Check description
    const descriptionResult = window.ContentModeration.checkContent(description, 'video-description');
    if (!descriptionResult.isAppropriate) {
      return {
        allowed: false,
        field: 'description',
        message: 'Description is not appropriate: ' + descriptionResult.issues.join(', '),
        suggestions: descriptionResult.suggestions
      };
    }

    // Check overall content safety score
    const titleScore = window.ContentModeration.getContentSafetyScore(title);
    const descriptionScore = window.ContentModeration.getContentSafetyScore(description);
    const overallScore = (titleScore + descriptionScore) / 2;

    if (overallScore < 60) {
      return {
        allowed: false,
        field: 'overall',
        message: 'Content safety score too low (' + Math.round(overallScore) + '/100). Please make your content more positive and family-friendly.',
        suggestions: ['Use more positive language', 'Avoid potentially offensive terms', 'Focus on educational or entertaining content']
      };
    }

    return { allowed: true, score: overallScore };
  }

  handleViolations(violations) {
    if (violations.length === 0) return { allowed: true };
    
    const severeCount = violations.filter(v => v.type === 'severe').length;
    const moderateCount = violations.filter(v => v.type === 'moderate').length;
    const mildCount = violations.filter(v => v.type === 'mild').length;
    
    // Add to user violations
    this.userViolations.push({
      timestamp: Date.now(),
      violations: violations,
      severe: severeCount,
      moderate: moderateCount,
      mild: mildCount
    });
    
    localStorage.setItem('userViolations', JSON.stringify(this.userViolations));
    
    // Determine action based on severity and history
    const recentViolations = this.userViolations.filter(v => 
      Date.now() - v.timestamp < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );
    
    const totalSevere = recentViolations.reduce((sum, v) => sum + v.severe, 0);
    const totalModerate = recentViolations.reduce((sum, v) => sum + v.moderate, 0);
    const totalMild = recentViolations.reduce((sum, v) => sum + v.mild, 0);
    
    // Severe violations - immediate action
    if (severeCount > 0) {
      if (totalSevere >= 3) {
        return { 
          allowed: false, 
          action: 'permanent_ban',
          message: 'Your account has been permanently banned due to repeated severe violations of our community guidelines.'
        };
      } else if (totalSevere >= 2) {
        return { 
          allowed: false, 
          action: 'suspension',
          message: 'Your account has been suspended for 7 days due to severe violations. This is your final warning.'
        };
      } else {
        return { 
          allowed: false, 
          action: 'warning',
          message: 'This content violates our community guidelines. Please review our guidelines and try again.'
        };
      }
    }
    
    // Moderate violations
    if (moderateCount > 0) {
      if (totalModerate >= 5) {
        return { 
          allowed: false, 
          action: 'suspension',
          message: 'Your account has been suspended for 3 days due to repeated violations.'
        };
      } else if (totalModerate >= 3) {
        return { 
          allowed: false, 
          action: 'warning',
          message: 'Warning: This content may violate our guidelines. Please review and modify.'
        };
      }
    }
    
    // Mild violations - just warnings
    if (mildCount > 0 && totalMild >= 10) {
      return { 
        allowed: false, 
        action: 'warning',
        message: 'Please keep your content positive and respectful.'
      };
    }
    
    return { allowed: true };
  }

  async handleFormSubmission() {
    const title = document.getElementById('video-title').value;
    const description = document.getElementById('video-description').value;
    
    // Content moderation
    const violations = this.moderateContent(title, description);
    const moderationResult = this.handleViolations(violations);
    
    if (!moderationResult.allowed) {
      this.showNotification(moderationResult.message, 'error');
      
      // Log the action
      if (moderationResult.action === 'permanent_ban') {
        localStorage.setItem('accountStatus', 'banned');
      } else if (moderationResult.action === 'suspension') {
        const suspensionEnd = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        localStorage.setItem('suspensionEnd', suspensionEnd.toString());
      }
      
      return;
    }
    
    // Check account status
    const accountStatus = localStorage.getItem('accountStatus');
    if (accountStatus === 'banned') {
      this.showNotification('Your account has been banned.', 'error');
      return;
    }
    
    const suspensionEnd = localStorage.getItem('suspensionEnd');
    if (suspensionEnd && Date.now() < parseInt(suspensionEnd)) {
      const remaining = new Date(parseInt(suspensionEnd));
      this.showNotification(`Your account is suspended until ${remaining.toLocaleDateString()}.`, 'error');
      return;
    }
    
    // Proceed with upload
    const selectedMethod = document.querySelector('[data-method].selected')?.dataset.method;
    const formData = {
      title,
      description,
      category: document.getElementById('video-category').value,
      visibility: document.querySelector('[data-visibility].selected')?.dataset.visibility || 'public'
    };
    
    if (selectedMethod === 'url') {
      formData.url = document.getElementById('video-url').value;
      formData.videoId = this.extractYouTubeID(formData.url);
    } else if (selectedMethod === 'file') {
      formData.file = document.getElementById('video-file').files[0];
      formData.videoId = 'file_' + Date.now();
    }
    
    await this.publishVideo(formData);
  }

  async publishRecording() {
    const title = document.getElementById('record-title').value;
    const description = document.getElementById('record-description').value;
    
    if (!title || !this.recordedBlob) {
      this.showNotification('Please provide a title for your recording.', 'error');
      return;
    }
    
    // Content moderation
    const violations = this.moderateContent(title, description);
    const moderationResult = this.handleViolations(violations);
    
    if (!moderationResult.allowed) {
      this.showNotification(moderationResult.message, 'error');
      return;
    }
    
    const formData = {
      title,
      description,
      category: document.getElementById('record-category').value,
      visibility: 'public',
      recording: this.recordedBlob,
      videoId: 'recording_' + Date.now()
    };
    
    await this.publishVideo(formData);
  }

  async publishVideo(formData) {
    const statusMessage = document.getElementById('status-message');
    const uploadButton = document.getElementById('upload-button');
    const publishButton = document.getElementById('publish-recording');
    
    const activeButton = uploadButton?.disabled === false ? uploadButton : publishButton;
    
    if (activeButton) {
      activeButton.textContent = 'Publishing...';
      activeButton.disabled = true;
    }
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get current user info
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userChannel = currentUser.displayName || currentUser.email || 'Your Channel';
      
      // Save video to localStorage
      const videos = JSON.parse(localStorage.getItem('jonahtube_videos') || '[]');
      
      const newVideo = {
        id: Date.now().toString(),
        videoId: formData.videoId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        visibility: formData.visibility,
        channel: userChannel,
        channelAvatar: currentUser.photoURL || '👤',
        views: '0 views',
        uploadTime: 'just now',
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        comments: [],
        duration: formData.recording ? '0:30' : '3:45', // Default durations
        isRecording: !!formData.recording
      };
      
      videos.unshift(newVideo);
      localStorage.setItem('jonahtube_videos', JSON.stringify(videos));
      
      // Update user's video count
      const userStats = JSON.parse(localStorage.getItem('userStats') || '{}');
      userStats.videosUploaded = (userStats.videosUploaded || 0) + 1;
      userStats.totalViews = (userStats.totalViews || 0);
      localStorage.setItem('userStats', JSON.stringify(userStats));
      
      statusMessage.className = 'status-message success';
      statusMessage.textContent = `🎉 "${formData.title}" has been published successfully!`;
      
      // Auto redirect after success
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      statusMessage.className = 'status-message error';
      statusMessage.textContent = 'Upload failed. Please try again.';
      
      if (activeButton) {
        activeButton.textContent = activeButton === uploadButton ? 'Publish Video' : 'Publish Recording';
        activeButton.disabled = false;
      }
    }
  }

  isValidYouTubeUrl(url) {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    return pattern.test(url);
  }

  extractYouTubeID(url) {
    const regExp = /^.*(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize the creator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new JonahTubeCreator();
});
