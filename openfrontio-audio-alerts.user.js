// ==UserScript==
// @name         OpenFrontIO Alerts
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Play configurable sounds for OpenFrontIO alerts (Attack, Nuke, Hydrogen, Boarding)
// @author       You
// @match        https://openfront.io/*
// @match        http://localhost:8080/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=openfront.io
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration & State ---
    const DEFAULT_CONFIG = {
        enabled: true,
        sounds: {
            attack: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_b900cfe483.mp3',
            nuke: 'https://cdn.pixabay.com/download/audio/2024/12/21/audio_b7f764ad51.mp3',
            hydrogen: 'https://cdn.pixabay.com/download/audio/2024/07/18/audio_ddb77774ac.mp3',
            boarding: 'https://cdn.pixabay.com/download/audio/2025/02/28/audio_42b51e43df.mp3'
        },
        volumes: {
            attack: 25,
            nuke: 25,
            hydrogen: 25,
            boarding: 25
        }
    };

    let config = JSON.parse(localStorage.getItem('ofio_audio_alerts_config')) || DEFAULT_CONFIG;
    // Ensure volumes exist in config if loading from old version
    if (!config.volumes) {
        config.volumes = DEFAULT_CONFIG.volumes;
    }

    const audioPlayers = {};
    
    // State for attack tracking
    let previousAttackerIds = new Set();

    // --- Sound Player ---
    function playSound(type) {
        if (!config.enabled) return;

        const url = config.sounds[type];
        if (!url) return;

        // console.log(`[AudioAlerts] Playing sound for: ${type}`);

        let audio = audioPlayers[type];
        if (!audio) {
            audio = new Audio(url);
            audioPlayers[type] = audio;
        } else {
            // Restart if already playing
            audio.pause();
            audio.currentTime = 0;
        }

        // Update URL if changed (normalize both to absolute URLs for comparison)
        const resolvedUrl = new URL(url, window.location.href).href;
        if (audio.src !== resolvedUrl) {
            audio.src = url;
        }

        // Set volume
        const vol = config.volumes[type] !== undefined ? config.volumes[type] : 100;
        audio.volume = vol / 100;

        audio.play().catch(e => console.error(`[AudioAlerts] Failed to play ${type} sound:`, e));
    }

    // --- UI ---
    function createSettingsModal() {
        const modalId = 'ofio-audio-settings-modal';
        if (document.getElementById(modalId)) return;

        // Inject global styles
        if (!document.getElementById('ofio-audio-styles')) {
            const style = document.createElement('style');
            style.id = 'ofio-audio-styles';
            style.textContent = `
                #ofio-audio-settings-modal {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .ofio-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 9998;
                    display: none;
                }
                .ofio-sound-card {
                    background: #1a1a1a;
                    border: 1px solid #2d2d2d;
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 12px;
                }
                .ofio-sound-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                .ofio-sound-card-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #e0e0e0;
                    margin: 0;
                }
                .ofio-volume-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 12px;
                }
                .ofio-volume-label {
                    font-size: 12px;
                    color: #999;
                    min-width: 50px;
                }
                .ofio-volume-value {
                    font-size: 12px;
                    color: #ccc;
                    min-width: 35px;
                    text-align: right;
                }
                .ofio-slider {
                    flex: 1;
                    height: 6px;
                    border-radius: 3px;
                    background: #2d2d2d;
                    outline: none;
                    -webkit-appearance: none;
                }
                .ofio-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #4a9eff;
                    cursor: pointer;
                    border: 2px solid #1a1a1a;
                }
                .ofio-slider::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #4a9eff;
                    cursor: pointer;
                    border: 2px solid #1a1a1a;
                }
                .ofio-btn {
                    padding: 8px 16px;
                    border-radius: 6px;
                    border: none;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .ofio-btn:hover {
                    opacity: 0.9;
                }
                .ofio-btn:active {
                    opacity: 0.8;
                }
                .ofio-btn-primary {
                    background: #4a9eff;
                    color: white;
                }
                .ofio-btn-secondary {
                    background: #2d2d2d;
                    color: #e0e0e0;
                }
                .ofio-btn-small {
                    padding: 6px 12px;
                    font-size: 12px;
                }
                .ofio-input {
                    width: 100%;
                    padding: 10px;
                    background: #0f0f0f;
                    border: 1px solid #2d2d2d;
                    border-radius: 6px;
                    color: #e0e0e0;
                    font-size: 13px;
                    font-family: 'Monaco', 'Menlo', monospace;
                }
                .ofio-input:focus {
                    outline: none;
                    border-color: #4a9eff;
                }
                .ofio-toggle {
                    position: relative;
                    width: 48px;
                    height: 26px;
                    background: #2d2d2d;
                    border-radius: 13px;
                    cursor: pointer;
                    border: none;
                }
                .ofio-toggle::after {
                    content: '';
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }
                .ofio-toggle.active {
                    background: #4a9eff;
                }
                .ofio-toggle.active::after {
                    transform: translateX(22px);
                }
            `;
            document.head.appendChild(style);
        }

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'ofio-modal-overlay';
        overlay.id = 'ofio-audio-overlay';
        overlay.onclick = () => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
        };

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #141414;
            color: #e0e0e0;
            padding: 24px;
            border-radius: 16px;
            z-index: 10000;
            display: none;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            min-width: 560px;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;';
        
        const title = document.createElement('h2');
        title.textContent = 'Audio Alerts';
        title.style.cssText = 'margin: 0; font-size: 20px; font-weight: 600; color: #fff;';
        header.appendChild(title);

        // Enabled Toggle
        const toggleContainer = document.createElement('div');
        toggleContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;';
        const toggleLabel = document.createElement('span');
        toggleLabel.textContent = 'Enabled';
        toggleLabel.style.cssText = 'font-size: 13px; color: #999;';
        const toggle = document.createElement('button');
        toggle.className = 'ofio-toggle' + (config.enabled ? ' active' : '');
        toggle.onclick = () => {
            toggle.classList.toggle('active');
        };
        toggleContainer.appendChild(toggleLabel);
        toggleContainer.appendChild(toggle);
        header.appendChild(toggleContainer);
        modal.appendChild(header);

        // Sound Cards
        const soundTypes = [
            { key: 'attack', label: 'Attack Alert' },
            { key: 'nuke', label: 'Nuclear Launch' },
            { key: 'hydrogen', label: 'Hydrogen Bomb' },
            { key: 'boarding', label: 'Naval Invasion' }
        ];

        const inputs = {};
        const volumeInputs = {};

        soundTypes.forEach(type => {
            const card = document.createElement('div');
            card.className = 'ofio-sound-card';

            const cardHeader = document.createElement('div');
            cardHeader.className = 'ofio-sound-card-header';
            
            const cardTitle = document.createElement('h3');
            cardTitle.className = 'ofio-sound-card-title';
            cardTitle.textContent = type.label;
            cardHeader.appendChild(cardTitle);

            const btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display: flex; gap: 8px;';
            
            const testBtn = document.createElement('button');
            testBtn.className = 'ofio-btn ofio-btn-secondary ofio-btn-small';
            testBtn.textContent = 'Test';
            testBtn.onclick = () => {
                const tempAudio = new Audio(inputs[type.key].value);
                tempAudio.volume = parseInt(volumeInputs[type.key].value) / 100;
                tempAudio.play().catch(e => alert('Failed to play sound: ' + e.message));
            };
            btnGroup.appendChild(testBtn);

            const resetBtn = document.createElement('button');
            resetBtn.className = 'ofio-btn ofio-btn-secondary ofio-btn-small';
            resetBtn.textContent = 'Reset';
            resetBtn.onclick = () => {
                inputs[type.key].value = DEFAULT_CONFIG.sounds[type.key];
            };
            btnGroup.appendChild(resetBtn);

            cardHeader.appendChild(btnGroup);
            card.appendChild(cardHeader);

            // URL Input
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'ofio-input';
            input.value = config.sounds[type.key] || '';
            input.placeholder = 'Sound URL';
            inputs[type.key] = input;
            card.appendChild(input);

            // Volume Control
            const volGroup = document.createElement('div');
            volGroup.className = 'ofio-volume-group';
            
            const volLabel = document.createElement('span');
            volLabel.className = 'ofio-volume-label';
            volLabel.textContent = 'Volume';
            
            const volInput = document.createElement('input');
            volInput.type = 'range';
            volInput.className = 'ofio-slider';
            volInput.min = '0';
            volInput.max = '100';
            volInput.value = config.volumes[type.key] !== undefined ? config.volumes[type.key] : 50;
            volumeInputs[type.key] = volInput;
            
            const volValue = document.createElement('span');
            volValue.className = 'ofio-volume-value';
            volValue.textContent = volInput.value + '%';
            volInput.oninput = () => {
                volValue.textContent = volInput.value + '%';
            };
            
            volGroup.appendChild(volLabel);
            volGroup.appendChild(volInput);
            volGroup.appendChild(volValue);
            card.appendChild(volGroup);

            modal.appendChild(card);
        });

        // Footer Buttons
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #2d2d2d;';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'ofio-btn ofio-btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
        };

        const saveBtn = document.createElement('button');
        saveBtn.className = 'ofio-btn ofio-btn-primary';
        saveBtn.textContent = 'Save';
        saveBtn.onclick = () => {
            config.enabled = toggle.classList.contains('active');
            soundTypes.forEach(type => {
                config.sounds[type.key] = inputs[type.key].value;
                config.volumes[type.key] = parseInt(volumeInputs[type.key].value);
            });
            localStorage.setItem('ofio_audio_alerts_config', JSON.stringify(config));
            overlay.style.display = 'none';
            modal.style.display = 'none';
            Object.keys(audioPlayers).forEach(key => {
                if (audioPlayers[key]) {
                    audioPlayers[key].src = config.sounds[key];
                    audioPlayers[key].volume = config.volumes[key] / 100;
                }
            });
        };

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        modal.appendChild(footer);

        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        return modal;
    }

    function createSettingsButton() {
        if (document.getElementById('ofio-audio-settings-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'ofio-audio-settings-btn';
        btn.textContent = '🔊';
        btn.title = 'Audio Alerts Settings';
        btn.style.cssText = `
            position: fixed;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
            width: 48px;
            height: 48px;
            border-radius: 0 12px 12px 0;
            background: #1a1a1a;
            color: #fff;
            border: 1px solid #2d2d2d;
            border-left: none;
            cursor: pointer;
            z-index: 9999;
            font-size: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 2px 0 8px rgba(0,0,0,0.3);
        `;
        
        btn.onmouseenter = () => {
            btn.style.background = '#252525';
        };
        btn.onmouseleave = () => {
            btn.style.background = '#1a1a1a';
        };
        
        btn.onclick = () => {
            const modal = document.getElementById('ofio-audio-settings-modal') || createSettingsModal();
            const overlay = document.getElementById('ofio-audio-overlay');
            if (overlay) overlay.style.display = 'block';
            modal.style.display = 'block';
        };

        document.body.appendChild(btn);
    }

    // --- Hooks ---
    function initHooks() {
        console.log('[AudioAlerts] Initializing hooks...');

        // Hook AlertFrame.prototype.tick
        const maxAttempts = 60;
        let attempts = 0;
        const waitForAlertFrame = setInterval(() => {
            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(waitForAlertFrame);
                console.warn('[AudioAlerts] Failed to hook AlertFrame.prototype.tick after', maxAttempts, 'attempts');
                return;
            }
            
            const alertFrame = customElements.get('alert-frame');
            if (alertFrame && alertFrame.prototype && alertFrame.prototype.tick) {
                clearInterval(waitForAlertFrame);
                console.log('[AudioAlerts] Hooked AlertFrame.prototype.tick');
                
                const originalTick = alertFrame.prototype.tick;
                alertFrame.prototype.tick = function() {
                    // Call original
                    originalTick.apply(this, arguments);

                    // Custom Logic
                    try {
                        if (!this.game) return;

                        // 1. Attack Detection
                        const myPlayer = this.game.myPlayer();
                        if (myPlayer && myPlayer.isAlive()) {
                            const incomingAttacks = myPlayer.incomingAttacks();
                            const currentAttackerIds = new Set();

                            for (const attack of incomingAttacks) {
                                if (attack.retreating) continue;
                                currentAttackerIds.add(attack.attackerID);
                            }

                            // Check for NEW attackers
                            for (const attackerId of currentAttackerIds) {
                                if (!previousAttackerIds.has(attackerId)) {
                                    // This is a new attacker (or re-attacking after stopping)
                                    
                                    // Resolve Name
                                    let attackerName = `ID:${attackerId}`;
                                    try {
                                        const attacker = this.game.playerBySmallID(attackerId);
                                        if (attacker) {
                                            // Try different name properties based on what Player object has
                                            attackerName = (typeof attacker.name === 'function') ? attacker.name() : 
                                                           (typeof attacker.displayName === 'function') ? attacker.displayName() : 
                                                           attacker.name || attacker.displayName || `ID:${attackerId}`;
                                        }
                                    } catch (err) {
                                        console.warn('[AudioAlerts] Failed to resolve attacker name', err);
                                    }

                                    console.log(`[AudioAlerts] New attacker detected: ${attackerName} (ID: ${attackerId})`);
                                    playSound('attack');
                                }
                            }

                            // Update state
                            previousAttackerIds = currentAttackerIds;
                        } else {
                            previousAttackerIds.clear();
                        }

                        // 2. Special Alerts (Nuke, Hydrogen, Boarding)
                        // GameUpdateType.UnitIncoming = 14
                        if (myPlayer && myPlayer.isAlive()) {
                            const updates = this.game.updatesSinceLastTick();
                            if (updates && updates[14]) {
                                for (const event of updates[14]) {
                                    // Filter out events not meant for us
                                    if (event.playerID !== myPlayer.smallID()) {
                                        continue;
                                    }

                                    // MessageTypes: NUKE_INBOUND=5, HYDROGEN_BOMB_INBOUND=6, NAVAL_INVASION_INBOUND=7
                                    if (event.messageType === 5) {
                                        console.log('[AudioAlerts] Nuke detected!');
                                        playSound('nuke');
                                    } else if (event.messageType === 6) {
                                        console.log('[AudioAlerts] Hydrogen Bomb detected!');
                                        playSound('hydrogen');
                                    } else if (event.messageType === 7) {
                                        console.log('[AudioAlerts] Naval Invasion detected!');
                                        playSound('boarding');
                                    }
                                }
                            }
                        }

                    } catch (e) {
                        console.error('[AudioAlerts] Error in tick hook:', e);
                    }
                };
            }
        }, 1000);
    }

    // --- Init ---
    function init() {
        createSettingsButton();
        initHooks();
        
        // Watch for body changes in case the button is removed
        const observer = new MutationObserver(() => {
            createSettingsButton();
        });
        observer.observe(document.body, { childList: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
