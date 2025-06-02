// ShoreSquad Main Application
const CONFIG = {
    MAPBOX_TOKEN: prompt('Please enter your Mapbox token (or use default demo token):', 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2V5...'), // Will prompt user for token
    OPENWEATHER_KEY: prompt('Please enter your OpenWeather API key:', 'your-key-here'),
    DEFAULT_LOCATION: { lat: 34.0522, lng: -118.2437 } // Default to LA
};

// User Preferences and Storage Management
const StorageManager = {
    KEYS: {
        JOINED_EVENTS: 'shoresquad_joined_events',
        USER_PREFS: 'shoresquad_user_prefs'
    },

    getJoinedEvents() {
        const stored = localStorage.getItem(this.KEYS.JOINED_EVENTS);
        return stored ? JSON.parse(stored) : [];
    },

    addJoinedEvent(eventId) {
        const events = this.getJoinedEvents();
        if (!events.includes(eventId)) {
            events.push(eventId);
            localStorage.setItem(this.KEYS.JOINED_EVENTS, JSON.stringify(events));
        }
    },

    getUserPreferences() {
        const stored = localStorage.getItem(this.KEYS.USER_PREFS);
        return stored ? JSON.parse(stored) : {
            notificationsEnabled: true,
            defaultView: 'upcoming',
            temperatureUnit: 'celsius'
        };
    },

    updateUserPreferences(prefs) {
        const current = this.getUserPreferences();
        const updated = { ...current, ...prefs };
        localStorage.setItem(this.KEYS.USER_PREFS, JSON.stringify(updated));
        return updated;
    }
};

// Achievement System
const AchievementSystem = {
    ACHIEVEMENTS: {
        FIRST_CLEANUP: {
            id: 'first_cleanup',
            title: 'Beach Guardian',
            description: 'Join your first beach cleanup event',
            icon: '🌊'
        },
        SOCIAL_SHARER: {
            id: 'social_sharer',
            title: 'Environmental Influencer',
            description: 'Share a cleanup event on social media',
            icon: '📢'
        },
        EARLY_BIRD: {
            id: 'early_bird',
            title: 'Early Bird',
            description: 'Join a cleanup event more than 2 weeks in advance',
            icon: '🌅'
        }
    },

    init() {
        const achievements = localStorage.getItem('shoresquad_achievements');
        return achievements ? JSON.parse(achievements) : [];
    },

    earn(achievementId) {
        const achievements = this.init();
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            localStorage.setItem('shoresquad_achievements', JSON.stringify(achievements));
            this.showAchievementNotification(achievementId);
        }
    },

    showAchievementNotification(achievementId) {
        const achievement = this.ACHIEVEMENTS[achievementId];
        showNotification(
            `${achievement.icon} Achievement Unlocked: ${achievement.title}
            <br>${achievement.description}`,
            'success'
        );
    },

    updateDashboard() {
        const achievementsGrid = document.getElementById('achievements-grid');
        const eventsJoinedElement = document.getElementById('eventsJoined');
        const achievementsEarnedElement = document.getElementById('achievementsEarned');

        // Get earned achievements
        const earnedAchievements = this.init();
        
        // Update achievements grid
        achievementsGrid.innerHTML = Object.values(this.ACHIEVEMENTS)
            .map(achievement => `
                <div class="achievement-card ${earnedAchievements.includes(achievement.id) ? 'earned' : 'locked'}">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div class="achievement-info">
                        <h4>${achievement.title}</h4>
                        <p>${achievement.description}</p>
                    </div>
                </div>
            `)
            .join('');

        // Update impact stats
        const joinedEvents = StorageManager.getJoinedEvents();
        eventsJoinedElement.textContent = joinedEvents.length;
        achievementsEarnedElement.textContent = earnedAchievements.length;
    }
};

// Profile and Gamification System
const ProfileSystem = {
    LEVELS: {
        XP_PER_LEVEL: 100,
        MULTIPLIER: 1.5
    },

    BADGES: {
        NOVICE_CLEANER: {
            id: 'novice_cleaner',
            name: 'Novice Cleaner',
            icon: '🌱',
            requirement: 'Complete your first cleanup'
        },
        SQUAD_LEADER: {
            id: 'squad_leader',
            name: 'Squad Leader',
            icon: '👑',
            requirement: 'Lead a cleanup event'
        },
        BEACH_HERO: {
            id: 'beach_hero',
            name: 'Beach Hero',
            icon: '🦸',
            requirement: 'Collect over 100kg of trash'
        },
        CONSISTENT_CLEANER: {
            id: 'consistent_cleaner',
            name: 'Consistent Cleaner',
            icon: '📅',
            requirement: 'Attend 5 cleanups'
        },
        SOCIAL_BUTTERFLY: {
            id: 'social_butterfly',
            name: 'Social Butterfly',
            icon: '🦋',
            requirement: 'Invite 3 friends to cleanups'
        }
    },

    init() {
        this.profile = this.loadProfile();
        this.updateUI();
        this.setupEventListeners();
    },

    loadProfile() {
        const stored = localStorage.getItem('user_profile');
        return stored ? JSON.parse(stored) : {
            name: 'Beach Guardian',
            level: 1,
            xp: 0,
            badges: [],
            stats: {
                eventsCompleted: 0,
                trashCollected: 0,
                friendsInvited: 0
            }
        };
    },

    saveProfile() {
        localStorage.setItem('user_profile', JSON.stringify(this.profile));
    },

    addXP(amount) {
        this.profile.xp += amount;
        const xpForNextLevel = this.getXPForNextLevel();
        
        if (this.profile.xp >= xpForNextLevel) {
            this.levelUp();
        }

        this.saveProfile();
        this.updateUI();
    },

    getXPForNextLevel() {
        return Math.floor(this.LEVELS.XP_PER_LEVEL * 
            Math.pow(this.LEVELS.MULTIPLIER, this.profile.level - 1));
    },

    levelUp() {
        this.profile.level++;
        showNotification(
            `🎉 Level Up! You're now level ${this.profile.level}!`,
            'achievement'
        );
        document.getElementById('userLevel').classList.add('level-up');
        setTimeout(() => {
            document.getElementById('userLevel').classList.remove('level-up');
        }, 500);
    },

    awardBadge(badgeId) {
        if (!this.profile.badges.includes(badgeId)) {
            this.profile.badges.push(badgeId);
            const badge = this.BADGES[badgeId];
            showNotification(
                `${badge.icon} New Badge: ${badge.name}!<br>${badge.requirement}`,
                'achievement'
            );
            this.saveProfile();
            this.updateUI();
        }
    },

    updateStats(stats) {
        Object.assign(this.profile.stats, stats);
        this.checkBadgeProgress();
        this.saveProfile();
        this.updateUI();
    },

    checkBadgeProgress() {
        const { stats, badges } = this.profile;

        if (stats.eventsCompleted >= 1 && !badges.includes('NOVICE_CLEANER')) {
            this.awardBadge('NOVICE_CLEANER');
        }
        if (stats.trashCollected >= 100 && !badges.includes('BEACH_HERO')) {
            this.awardBadge('BEACH_HERO');
        }
        if (stats.eventsCompleted >= 5 && !badges.includes('CONSISTENT_CLEANER')) {
            this.awardBadge('CONSISTENT_CLEANER');
        }
        if (stats.friendsInvited >= 3 && !badges.includes('SOCIAL_BUTTERFLY')) {
            this.awardBadge('SOCIAL_BUTTERFLY');
        }
    },

    updateUI() {
        // Update profile panel
        document.getElementById('profileName').textContent = this.profile.name;
        document.getElementById('userLevel').textContent = this.profile.level;
        document.getElementById('currentXP').textContent = this.profile.xp;
        document.getElementById('nextLevelXP').textContent = this.getXPForNextLevel();
        document.getElementById('levelProgress').style.width = 
            `${(this.profile.xp / this.getXPForNextLevel()) * 100}%`;

        // Update badges grid
        const badgesGrid = document.getElementById('badgesGrid');
        badgesGrid.innerHTML = Object.entries(this.BADGES)
            .map(([id, badge]) => `
                <div class="badge-item ${this.profile.badges.includes(id) ? 'earned' : 'locked'}">
                    <span class="badge-icon">${badge.icon}</span>
                    <span class="badge-name">${badge.name}</span>
                </div>
            `)
            .join('');

        // Update stats
        document.getElementById('userTrashCollected').textContent = 
            this.profile.stats.trashCollected;
        document.getElementById('userEventsCompleted').textContent = 
            this.profile.stats.eventsCompleted;
    },

    setupEventListeners() {
        const profileButton = document.getElementById('profileButton');
        const closeProfile = document.getElementById('closeProfile');
        const profilePanel = document.getElementById('profilePanel');

        profileButton.addEventListener('click', () => {
            profilePanel.classList.add('active');
            this.updateUI();
        });

        closeProfile.addEventListener('click', () => {
            profilePanel.classList.remove('active');
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!profilePanel.contains(e.target) && 
                !profileButton.contains(e.target) && 
                profilePanel.classList.contains('active')) {
                profilePanel.classList.remove('active');
            }
        });
    }
};

// Filter functions
const dateFilters = {
    all: () => true,
    upcoming: location => new Date(location.date) >= new Date(),
    week: location => {
        const eventDate = new Date(location.date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return eventDate >= new Date() && eventDate <= weekFromNow;
    },
    month: location => {
        const eventDate = new Date(location.date);
        const monthFromNow = new Date();
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        return eventDate >= new Date() && eventDate <= monthFromNow;
    }
};

// Update cleanupLocations with more realistic dates
const cleanupLocations = [
    {
        id: 1,
        name: "Santa Monica Beach",
        coordinates: [-118.4912, 34.0195],
        date: "2025-06-15",
        participants: 25,
        trashCollected: 150,
        isCompleted: false
    },
    {
        id: 2,
        name: "Venice Beach",
        coordinates: [-118.4742, 33.9850],
        date: "2025-06-22",
        participants: 18,
        trashCollected: 120,
        isCompleted: false
    },
    {
        id: 3,
        name: "Manhattan Beach",
        coordinates: [-118.4109, 33.8837],
        date: "2025-06-29",
        participants: 30,
        trashCollected: 200,
        isCompleted: false
    }
];

// Notification System
const showNotification = (message, type = 'info') => {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    container.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
};

// Socket.IO initialization
const socket = io();

// Chat System
const ChatSystem = {
    init() {
        const chat = document.getElementById('event-chat');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessageBtn');
        const closeChatBtn = document.getElementById('closeChatBtn');
        const messagesContainer = document.getElementById('chat-messages');
        let currentEventId = null;

        const addMessage = (message, isSent = false) => {
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${isSent ? 'sent' : 'received'}`;
            messageElement.innerHTML = `
                <div class="user">${message.user}</div>
                <div class="content">${message.message}</div>
                <div class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</div>
            `;
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        const openChat = (eventId) => {
            currentEventId = eventId;
            chat.classList.add('active');
            socket.emit('joinEvent', eventId);
        };

        closeChatBtn.addEventListener('click', () => {
            chat.classList.remove('active');
            currentEventId = null;
        });

        sendButton.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (message && currentEventId) {
                const messageData = {
                    eventId: currentEventId,
                    user: 'You', // In a real app, this would be the user's name
                    message: message,
                    timestamp: new Date()
                };
                socket.emit('chatMessage', messageData);
                addMessage(messageData, true);
                messageInput.value = '';
            }
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendButton.click();
            }
        });

        // Socket event listeners
        socket.on('newMessage', (message) => {
            if (message.user !== 'You') {
                addMessage(message);
            }
        });

        return { openChat };
    }
};

// Community Impact Tracking
const ImpactTracker = {
    stats: {
        trashCollected: 0,
        totalVolunteers: 0,
        eventsCompleted: 0,
        beachesCleaned: 0
    },

    init() {
        // Load saved stats
        const savedStats = localStorage.getItem('community_impact');
        if (savedStats) {
            this.stats = JSON.parse(savedStats);
        }
        this.updateDisplay();
    },

    updateStats(newStats) {
        Object.assign(this.stats, newStats);
        localStorage.setItem('community_impact', JSON.stringify(this.stats));
        this.updateDisplay();
    },

    updateDisplay() {
        document.getElementById('trashCollected').textContent = this.stats.trashCollected;
        document.getElementById('totalVolunteers').textContent = this.stats.totalVolunteers;
        document.getElementById('eventsCompleted').textContent = this.stats.eventsCompleted;
        document.getElementById('beachesCleaned').textContent = this.stats.beachesCleaned;
    },

    incrementStats(eventData) {
        this.stats.trashCollected += eventData.trashCollected || 0;
        this.stats.totalVolunteers++;
        if (eventData.isCompleted) {
            this.stats.eventsCompleted++;
            this.stats.beachesCleaned++;
        }
        this.updateStats(this.stats);
    }
};

// Next Cleanup Location Configuration
const NEXT_CLEANUP = {
    name: "Pasir Ris",
    coordinates: {
        lat: 1.381497,
        lng: 103.955574
    },
    date: "2025-06-15", // Next cleanup date
    time: "09:00 AM"
};

document.addEventListener('DOMContentLoaded', () => {
    // Performance optimization - use passive event listeners
    const addPassiveListener = (element, eventName, handler) => {
        element.addEventListener(eventName, handler, { passive: true });
    };

    // Intersection Observer for lazy loading
    const observeElements = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        });

        document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
        });
    };

    let currentFilter = 'all';
    let markers = [];

    // Map initialization
    const initializeMap = () => {
        try {
            if (!mapboxgl.accessToken) {
                throw new Error('Mapbox token is not configured');
            }

            const map = new mapboxgl.Map({
                container: 'cleanup-map',
                style: 'mapbox://styles/mapbox/outdoors-v12',
                center: [CONFIG.DEFAULT_LOCATION.lng, CONFIG.DEFAULT_LOCATION.lat],
                zoom: 10
            });

            map.on('load', () => {
                showNotification('Map loaded successfully', 'success');
            });

            map.on('error', () => {
                showNotification('Error loading map data', 'error');
            });

            // Add navigation controls
            map.addControl(new mapboxgl.NavigationControl());
            map.addControl(new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true
            }));

            const updateMarkers = () => {
                // Clear existing markers
                markers.forEach(marker => marker.remove());
                markers = [];

                // Add new markers based on filter
                cleanupLocations.filter(dateFilters[currentFilter]).forEach(location => {
                    const el = document.createElement('div');
                    el.className = 'marker';
                    
                    const marker = new mapboxgl.Marker(el)
                        .setLngLat(location.coordinates)
                        .setPopup(new mapboxgl.Popup({ offset: 25 })
                            .setHTML(`
                                <h3>${location.name}</h3>
                                <p>Date: ${new Date(location.date).toLocaleDateString()}</p>
                                <p>Participants: ${location.participants}</p>
                                ${location.weather ? `
                                    <div class="weather-info">
                                        <img src="https://openweathermap.org/img/wn/${location.weather.icon}.png" alt="${location.weather.condition}">
                                        <span>${location.weather.temp}°C</span>
                                        <span>${location.weather.condition}</span>
                                    </div>
                                ` : ''}
                                <button onclick="joinCleanup(${location.id})" class="popup-button">Join Event</button>
                            `))
                        .addTo(map);
                    markers.push(marker);
                });
            };

            // Event listener for date filter with feedback
            document.getElementById('dateFilter').addEventListener('change', (e) => {
                currentFilter = e.target.value;
                updateMarkers();
                updateLocationList();
                showNotification(`Showing ${e.target.options[e.target.selectedIndex].text.toLowerCase()} events`, 'info');
            });

            updateMarkers();
        } catch (error) {
            showNotification(`Map initialization failed: ${error.message}`, 'error');
            document.getElementById('cleanup-map').innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <p>Sorry, we couldn't load the map. Please try refreshing the page.</p>
                </div>
            `;
        }
    };

    // Weather updates implementation with error handling
    const setupWeatherUpdates = async () => {
        const getWeatherForLocation = async (lat, lng) => {
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${CONFIG.OPENWEATHER_KEY}`
                );
                if (!response.ok) {
                    throw new Error('Weather service unavailable');
                }
                return await response.json();
            } catch (error) {
                showNotification(`Failed to load weather data: ${error.message}`, 'error');
                return null;
            }
        };

        // Update locations with weather data
        const updateLocationsWeather = async () => {
            let successCount = 0;
            for (const location of cleanupLocations) {
                const weather = await getWeatherForLocation(
                    location.coordinates[1],
                    location.coordinates[0]
                );
                if (weather) {
                    location.weather = {
                        temp: Math.round(weather.main.temp),
                        condition: weather.weather[0].main,
                        icon: weather.weather[0].icon,
                        wind: Math.round(weather.wind.speed)
                    };
                    successCount++;
                }
            }
            updateLocationList();
            
            if (successCount === cleanupLocations.length) {
                showNotification('Weather data updated successfully', 'success');
            } else if (successCount > 0) {
                showNotification('Some weather data could not be loaded', 'info');
            }
        };

        await updateLocationsWeather();
        // Update weather every 30 minutes
        setInterval(updateLocationsWeather, 30 * 60 * 1000);
    };

    const initializeCleanupLocations = () => {
        const joinedEvents = StorageManager.getJoinedEvents();
        cleanupLocations.forEach(location => {
            location.joined = joinedEvents.includes(location.id);
        });
    };

    const SocialSharing = {
        shareEvent(location) {
            const shareData = {
                title: 'Join me at ShoreSquad Beach Cleanup!',
                text: `I'm joining a beach cleanup at ${location.name} on ${new Date(location.date).toLocaleDateString()}. Come make a difference!`,
                url: window.location.href
            };

            if (navigator.share) {
                navigator.share(shareData)
                    .then(() => {
                        AchievementSystem.earn('SOCIAL_SHARER');
                        showNotification('Event shared successfully!', 'success');
                    })
                    .catch(error => {
                        if (error.name !== 'AbortError') {
                            showNotification('Failed to share event', 'error');
                        }
                    });
            } else {
                // Fallback for browsers that don't support native sharing
                const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
                window.open(shareUrl, '_blank');
                AchievementSystem.earn('SOCIAL_SHARER');
            }
        }
    };

    // Search functionality
    const SearchManager = {
        init() {
            const searchInput = document.getElementById('locationSearch');
            const searchButton = document.getElementById('searchButton');

            const handleSearch = () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                if (!searchTerm) {
                    updateLocationList();
                    return;
                }

                // Filter locations based on search term
                const filteredLocations = cleanupLocations.filter(location => 
                    location.name.toLowerCase().includes(searchTerm) ||
                    location.date.includes(searchTerm)
                );

                // Update location list with filtered results
                updateLocationList(filteredLocations);

                // Center map on first result if found
                if (filteredLocations.length > 0) {
                    const firstMatch = filteredLocations[0];
                    map.flyTo({
                        center: firstMatch.coordinates,
                        zoom: 12
                    });
                }
            };

            // Search on button click
            searchButton.addEventListener('click', handleSearch);

            // Search on enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });

            // Live search as user types (debounced)
            let debounceTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(handleSearch, 300);
            });
        }
    };

    // Enhanced Weather Service
    const WeatherService = {
        async getDetailedWeather(lat, lng) {
            try {
                // Get current weather
                const currentWeather = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${CONFIG.OPENWEATHER_KEY}`
                );
                
                if (!currentWeather.ok) throw new Error('Weather data fetch failed');
                const current = await currentWeather.json();

                // Get 5-day forecast
                const forecast = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${CONFIG.OPENWEATHER_KEY}`
                );
                
                if (!forecast.ok) throw new Error('Forecast data fetch failed');
                const forecastData = await forecast.json();

                return {
                    current: {
                        temp: Math.round(current.main.temp),
                        condition: current.weather[0].main,
                        icon: current.weather[0].icon,
                        wind: Math.round(current.wind.speed),
                        humidity: current.main.humidity,
                        feelsLike: Math.round(current.main.feels_like)
                    },
                    forecast: forecastData.list
                        .filter((item, index) => index % 8 === 0) // Get one forecast per day
                        .map(item => ({
                            date: new Date(item.dt * 1000).toLocaleDateString(),
                            temp: Math.round(item.main.temp),
                            condition: item.weather[0].main,
                            icon: item.weather[0].icon,
                            wind: Math.round(item.wind.speed)
                        }))
                };
            } catch (error) {
                console.error('Weather fetch error:', error);
                return null;
            }
        },

        // Mock tide data (in a real app, this would come from a tide API)
        async getTideData(lat, lng) {
            // Simulated tide data
            return {
                nextHigh: {
                    time: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString(),
                    height: '1.8m'
                },
                nextLow: {
                    time: new Date(Date.now() + 8 * 60 * 60 * 1000).toLocaleTimeString(),
                    height: '0.3m'
                },
                current: 'rising'
            };
        }
    };

    // Update the updateLocationList function to include detailed weather
    const updateLocationList = (filteredLocations = null) => {
        const locationList = document.getElementById('location-list');
        const locations = filteredLocations || cleanupLocations.filter(dateFilters[currentFilter]);
        const userPrefs = StorageManager.getUserPreferences();

        locationList.innerHTML = locations
            .map(location => `
                <div class="location-item ${location.joined ? 'joined' : ''} ${filteredLocations ? 'search-match' : ''}">
                    <h3>${location.name}</h3>
                    <div class="location-header">
                        <p>Date: ${new Date(location.date).toLocaleDateString()}</p>
                        <button onclick="SocialSharing.shareEvent(${JSON.stringify(location)})" class="share-button">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                    </div>
                    <p>Participants: ${location.participants}</p>
                    ${location.weather ? `
                        <div class="weather-info">
                            <div class="current-weather">
                                <img src="https://openweathermap.org/img/wn/${location.weather.current.icon}@2x.png" 
                                    alt="${location.weather.current.condition}">
                                <div class="weather-details">
                                    <span class="temp">${userPrefs.temperatureUnit === 'celsius' ? 
                                        `${location.weather.current.temp}°C` : 
                                        `${Math.round(location.weather.current.temp * 9/5 + 32)}°F`}</span>
                                    <span class="condition">${location.weather.current.condition}</span>
                                    <span class="wind">Wind: ${location.weather.current.wind} m/s</span>
                                    <span class="humidity">Humidity: ${location.weather.current.humidity}%</span>
                                </div>
                            </div>
                            ${location.weather.forecast ? `
                                <div class="forecast">
                                    ${location.weather.forecast.map(day => `
                                        <div class="forecast-day">
                                            <span class="date">${day.date}</span>
                                            <img src="https://openweathermap.org/img/wn/${day.icon}.png" 
                                                alt="${day.condition}">
                                            <span class="temp">${userPrefs.temperatureUnit === 'celsius' ? 
                                                `${day.temp}°C` : 
                                                `${Math.round(day.temp * 9/5 + 32)}°F`}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            ${location.tideData ? `
                                <div class="tide-info">
                                    <div class="tide-header">Tide Information</div>
                                    <div class="tide-details">
                                        <span>Next High: ${location.tideData.nextHigh.time} (${location.tideData.nextHigh.height})</span>
                                        <span>Next Low: ${location.tideData.nextLow.time} (${location.tideData.nextLow.height})</span>
                                        <span>Current: ${location.tideData.current}</span>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="weather-loading">
                            <span class="loading-spinner"></span>
                            Loading weather...
                        </div>
                    `}
                    <div class="action-buttons">
                        <button 
                            onclick="joinCleanup(${location.id})" 
                            class="list-button ${location.joined ? 'joined' : ''}"
                        >
                            ${location.joined ? 'Joined ✓' : 'Join Event'}
                        </button>
                    </div>
                </div>
            `)
            .join('');
    };

    // Update setupWeatherUpdates to include detailed weather and tide data
    const setupWeatherUpdates = async () => {
        const updateLocationsWeather = async () => {
            let successCount = 0;
            for (const location of cleanupLocations) {
                const weather = await WeatherService.getDetailedWeather(
                    location.coordinates[1],
                    location.coordinates[0]
                );
                const tideData = await WeatherService.getTideData(
                    location.coordinates[1],
                    location.coordinates[0]
                );
                
                if (weather) {
                    location.weather = weather;
                    location.tideData = tideData;
                    successCount++;
                }
            }
            updateLocationList();
            
            if (successCount === cleanupLocations.length) {
                showNotification('Weather and tide data updated successfully', 'success');
            } else if (successCount > 0) {
                showNotification('Some weather and tide data could not be loaded', 'info');
            }
        };

        await updateLocationsWeather();
        // Update weather and tide data every 30 minutes
        setInterval(updateLocationsWeather, 30 * 60 * 1000);
    };

    // Enhanced join cleanup handler with chat and impact tracking
    window.joinCleanup = (locationId) => {
        const location = cleanupLocations.find(loc => loc.id === locationId);
        if (location) {
            if (!location.joined) {
                location.participants++;
                location.joined = true;
                StorageManager.addJoinedEvent(locationId);
                
                // Update profile and gamification
                ProfileSystem.addXP(50); // Award XP for joining
                ProfileSystem.updateStats({
                    eventsCompleted: ProfileSystem.profile.stats.eventsCompleted + 1,
                    trashCollected: ProfileSystem.profile.stats.trashCollected + 
                        (location.trashCollected || 0)
                });

                // Update impact stats
                ImpactTracker.incrementStats({
                    trashCollected: location.trashCollected || 0,
                    isCompleted: false
                });

                // Open chat for the event
                ChatSystem.openChat(locationId);
                
                // Check for achievements
                const joinedEvents = StorageManager.getJoinedEvents();
                if (joinedEvents.length === 1) {
                    AchievementSystem.earn('FIRST_CLEANUP');
                    ProfileSystem.awardBadge('NOVICE_CLEANER');
                }

                const eventDate = new Date(location.date);
                const twoWeeksFromNow = new Date();
                twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
                if (eventDate > twoWeeksFromNow) {
                    AchievementSystem.earn('EARLY_BIRD');
                }

                updateLocationList();
                showNotification(
                    `<i class="fas fa-check"></i> You've successfully joined the cleanup at ${location.name}!`,
                    'success'
                );
            } else {
                ChatSystem.openChat(locationId);
            }
            updateMarkers();
        } else {
            showNotification('Could not find the specified event', 'error');
        }
    };

    // Social sharing with gamification
    window.shareEvent = (location) => {
        SocialSharing.shareEvent(location)
            .then(() => {
                ProfileSystem.addXP(25); // Award XP for sharing
                ProfileSystem.updateStats({
                    friendsInvited: ProfileSystem.profile.stats.friendsInvited + 1
                });
            });
    };

    // Update next cleanup information in the UI
    const updateNextCleanupInfo = () => {
        const nextCleanupTitle = document.querySelector('#next-cleanup-map h3');
        if (nextCleanupTitle) {
            const date = new Date(NEXT_CLEANUP.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            nextCleanupTitle.textContent = `Next Cleanup: ${NEXT_CLEANUP.name} - ${formattedDate} at ${NEXT_CLEANUP.time}`;
        }
    };

    // Call the update function
    updateNextCleanupInfo();

    // Initialize app components
    initializeMap();
    setupWeatherUpdates();
    initializeCleanupLocations();
    SearchManager.init();
    observeElements();

    // Initialize new systems
    ProfileSystem.init();
    ChatSystem.init();
    ImpactTracker.init();
});