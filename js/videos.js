function playVideoSafe(video) {
	if (!video.src && video.dataset.src) {
		video.src = video.dataset.src;
		video.load();
	}
	video.play().catch(() => {
		video.muted = true;
		video.play().catch(() => {});
	});
}

export function initVideos() {
	// GPU layer promotion observer
	const gpuLayerObserver = new IntersectionObserver((entries) => {
		entries.forEach(e => {
			if (e.isIntersecting) {
				e.target.style.willChange = 'transform';
				e.target.style.transform = 'translateZ(0)';
			} else {
				e.target.style.willChange = '';
				e.target.style.transform = '';
			}
		});
	}, { threshold: 0 });
	document.querySelectorAll('video').forEach(v => gpuLayerObserver.observe(v));

	// Portfolio video play/pause on visibility
	const videoObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			const video = entry.target;
			if (entry.isIntersecting) {
				playVideoSafe(video);
			} else {
				video.pause();
			}
		});
	}, { threshold: 0.01, rootMargin: '100px' });

	document.querySelectorAll('.portfolio-item video').forEach(video => {
		videoObserver.observe(video);
		video.addEventListener('error', () => {
			if (video.dataset.src && !video.dataset.retried) {
				video.dataset.retried = '1';
				setTimeout(() => {
					video.src = video.dataset.src;
					video.load();
				}, 2000);
			}
		});
	});
}
