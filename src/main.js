import { createIcons } from 'lucide';
import * as icons from 'lucide';
import Sortable from 'sortablejs';

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Icons
    createIcons({ icons });

    // Storage Helper
    const storage = {
        get: (key, def) => {
            try {
                const val = localStorage.getItem(key);
                return val ? JSON.parse(val) : def;
            } catch (e) { return def; }
        },
        set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
    };

    // State
    const state = {
        settings: storage.get('settings', {
            bgUrl: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop',
            userName: 'Traveler',
            focus: 25, short: 5, long: 15
        }),
        links: storage.get('links', []),
        tasks: storage.get('tasks', []),
        notes: storage.get('notes', ''),
        timer: { mode: 'focus', timeLeft: 25 * 60, isRunning: false }
    };

    let timerInterval;

    // --- DOM Elements ---
    const el = {
        clock: document.getElementById('clock'),
        date: document.getElementById('date'),
        greeting: document.getElementById('greeting'),
        timerDisplay: document.getElementById('timer'),
        modeBadge: document.getElementById('modeBadge'),
        toggleTimer: document.getElementById('toggleTimerBtn'),
        focusToggleTimer: document.getElementById('focusToggleTimerBtn'),
        reset: document.getElementById('resetBtn'),
        modeBtns: document.querySelectorAll('.mode-selector .pill'),
        linksGrid: document.getElementById('linksGrid'),
        addLinkBtn: document.getElementById('addLinkBtn'),
        linkModal: document.getElementById('linkModal'),
        closeLinkModal: document.getElementById('closeLinkModalBtn'),
        confirmLinkBtn: document.getElementById('confirmLinkBtn'),
        todoList: document.getElementById('todoList'),
        taskInput: document.getElementById('taskInput'),
        addTaskBtn: document.getElementById('addTaskBtn'),
        notes: document.getElementById('notesArea'),
        settingsModal: document.getElementById('settingsModal'),
        saveSettings: document.getElementById('saveSettingsBtn'),
        focusModeBtn: document.getElementById('focusModeBtn'),
        calendarBtn: document.getElementById('calendarBtn'),
        calendarModal: document.getElementById('calendarModal'),
        closeCalendarBtn: document.getElementById('closeCalendarBtn'),
        prevMonth: document.getElementById('prevMonth'),
        nextMonth: document.getElementById('nextMonth'),
        calendarTitle: document.getElementById('calendarTitle'),
        calendarDays: document.getElementById('calendarDays')
    };

    // --- Calendar ---
    let currentCalDate = new Date();

    function renderCalendar() {
        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();
        
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        
        el.calendarTitle.innerText = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalDate);
        
        let daysHtml = '';
        
        // Padding for first week
        for (let i = 0; i < firstDay; i++) {
            daysHtml += '<div class="calendar-day empty"></div>';
        }
        
        const today = new Date();
        for (let i = 1; i <= lastDate; i++) {
            const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
            daysHtml += `<div class="calendar-day ${isToday ? 'today' : ''}">${i}</div>`;
        }
        
        el.calendarDays.innerHTML = daysHtml;
    }

    el.calendarBtn.onclick = () => {
        currentCalDate = new Date();
        renderCalendar();
        el.calendarModal.classList.add('show');
    };

    el.closeCalendarBtn.onclick = () => el.calendarModal.classList.remove('show');
    
    el.prevMonth.onclick = () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderCalendar();
    };
    
    el.nextMonth.onclick = () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderCalendar();
    };

    // --- Sortable Quick Links ---
    new Sortable(el.linksGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        filter: '.add-link-card', // Don't allow dragging the "Add" button
        onMove: (evt) => {
            // Prevent dragging before the "Add" button (which is index 0)
            return evt.related.className.indexOf('add-link-card') === -1;
        },
        onEnd: () => {
            const newLinks = [];
            el.linksGrid.querySelectorAll('.link-item-wrapper').forEach(wrapper => {
                const index = parseInt(wrapper.dataset.index);
                if (!isNaN(index)) {
                    newLinks.push(state.links[index]);
                }
            });
            state.links = newLinks;
            storage.set('links', state.links);
            renderLinks(); // Re-render to update data-index attributes
        }
    });


    // --- Clock ---
    function updateClock() {
        const now = new Date();
        el.clock.innerText = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        el.date.innerText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const h = now.getHours();
        const greetingText = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
        el.greeting.innerText = `${greetingText}, ${state.settings.userName}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- Timer ---
    function updateTimerDisplay() {
        const m = Math.floor(state.timer.timeLeft / 60).toString().padStart(2, '0');
        const s = (state.timer.timeLeft % 60).toString().padStart(2, '0');
        el.timerDisplay.innerText = `${m}:${s}`;
        document.title = state.timer.isRunning ? `(${m}:${s}) ZenTab` : 'Zen Tab';

        el.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === state.timer.mode);
        });
        el.modeBadge.innerText = state.timer.mode.charAt(0).toUpperCase() + state.timer.mode.slice(1);

        // Update Toggle Buttons
        const icon = state.timer.isRunning ? 'pause' : 'play';
        const buttonContent = `<i data-lucide="${icon}"></i>`;
        el.toggleTimer.innerHTML = buttonContent;
        el.focusToggleTimer.innerHTML = buttonContent;
        createIcons({ icons });
    }

    function setMode(mode) {
        state.timer.mode = mode;
        state.timer.timeLeft = state.settings[mode] * 60;
        state.timer.isRunning = false;
        clearInterval(timerInterval);
        updateTimerDisplay();
    }

    function toggleTimer() {
        if (state.timer.isRunning) {
            state.timer.isRunning = false;
            clearInterval(timerInterval);
        } else {
            state.timer.isRunning = true;
            timerInterval = setInterval(() => {
                if (state.timer.timeLeft > 0) {
                    state.timer.timeLeft--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    state.timer.isRunning = false;
                    alert('Time is up!');
                    updateTimerDisplay();
                }
            }, 1000);
        }
        updateTimerDisplay();
    }

    el.toggleTimer.onclick = toggleTimer;
    el.focusToggleTimer.onclick = toggleTimer;

    el.reset.onclick = () => setMode(state.timer.mode);

    el.modeBtns.forEach(btn => {
        btn.onclick = () => setMode(btn.dataset.mode);
    });

    // --- Links ---
    function renderLinks() {
        const addCardHtml = `
            <button class="add-link-card" id="addLinkBtn">
                <i data-lucide="plus"></i>
                <span>Add New</span>
            </button>
        `;

        el.linksGrid.innerHTML = addCardHtml + state.links.map((link, i) => `
            <div class="link-item-wrapper" data-index="${i}">
                <a href="${link.url}" class="link-item">
                    <img src="https://www.google.com/s2/favicons?sz=64&domain=${link.url}" class="link-favicon">
                    <span>${link.title}</span>
                </a>
                <div class="link-menu-container">
                    <button class="link-menu-trigger" title="Options">
                        <i data-lucide="more-vertical" height="16" width="16"></i>
                    </button>
                    <div class="link-dropdown">
                        <button class="edit-link" data-index="${i}"><i data-lucide="edit-2" height="16" width="16"></i> Edit</button>
                        <button class="delete-link" data-index="${i}"><i data-lucide="trash-2" height="16" width="16"></i> Delete</button>
                    </div>
                </div>
            </div>
        `).join('');

        createIcons({ icons });

        // Re-bind add button since it's re-rendered
        document.getElementById('addLinkBtn').onclick = () => {
            document.getElementById('linkTitle').value = '';
            document.getElementById('linkUrl').value = '';
            el.confirmLinkBtn.innerText = 'Add Link';
            delete el.confirmLinkBtn.dataset.editIndex;
            el.linkModal.classList.add('show');
        };

        // Handle Click-to-Open Menu
        document.querySelectorAll('.link-menu-trigger').forEach(trigger => {
            trigger.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = trigger.nextElementSibling;
                const isShown = dropdown.classList.contains('show');

                // Close all first
                document.querySelectorAll('.link-dropdown.show').forEach(d => d.classList.remove('show'));

                if (!isShown) {
                    const rect = trigger.getBoundingClientRect();
                    dropdown.style.top = `${rect.bottom + 5}px`;
                    dropdown.style.left = `${rect.left - 85}px`; // Align to the right of trigger
                    dropdown.classList.add('show');
                }
            };
        });

        // Close dropdown on grid scroll
        el.linksGrid.onscroll = () => {
            document.querySelectorAll('.link-dropdown.show').forEach(d => d.classList.remove('show'));
        };

        document.querySelectorAll('.delete-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                const currentLinks = storage.get('links', []);
                currentLinks.splice(index, 1);
                state.links = currentLinks;
                storage.set('links', state.links);
                renderLinks();
            });
        });

        document.querySelectorAll('.edit-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                const link = state.links[index];

                document.getElementById('linkTitle').value = link.title;
                document.getElementById('linkUrl').value = link.url;
                el.confirmLinkBtn.innerText = 'Update Link';

                el.confirmLinkBtn.dataset.editIndex = index;
                el.linkModal.classList.add('show');
                // Close dropdown
                document.querySelectorAll('.link-dropdown.show').forEach(d => d.classList.remove('show'));
            });
        });
    }

    // Global click to close dropdowns
    window.addEventListener('click', () => {
        document.querySelectorAll('.link-dropdown.show').forEach(d => d.classList.remove('show'));
    });

    el.addLinkBtn.onclick = () => {
        document.getElementById('linkTitle').value = '';
        document.getElementById('linkUrl').value = '';
        el.confirmLinkBtn.innerText = 'Add Link';
        delete el.confirmLinkBtn.dataset.editIndex;
        el.linkModal.classList.add('show');
    };

    el.closeLinkModal.onclick = () => {
        el.linkModal.classList.remove('show');
    };

    el.confirmLinkBtn.onclick = () => {
        const title = document.getElementById('linkTitle').value;
        let url = document.getElementById('linkUrl').value.trim();
        const editIndex = el.confirmLinkBtn.dataset.editIndex;

        if (title && url) {
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }

            // Always get the latest links from storage before modifying
            const currentLinks = storage.get('links', []);

            if (editIndex !== undefined) {
                currentLinks[editIndex] = { title, url };
            } else {
                currentLinks.push({ title, url });
            }

            state.links = currentLinks;
            storage.set('links', state.links);
            renderLinks();
            el.linkModal.classList.remove('show');
        }
    };

    // --- Tasks ---
    function renderTasks() {
        el.todoList.innerHTML = state.tasks.map((task, i) => `
            <li class="todo-item ${task.done ? 'completed' : ''}" data-index="${i}">
                <div class="todo-check">${task.done ? '<i data-lucide="check" style="width:14px"></i>' : ''}</div>
                <span>${task.text}</span>
                <div class="task-delete" data-index="${i}" style="margin-left:auto; color:#ef4444; cursor: pointer;"><i data-lucide="trash-2" style="width:16px"></i></div>
            </li>
        `).join('');
        createIcons({ icons });

        document.querySelectorAll('.todo-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.task-delete')) return;
                const index = parseInt(item.getAttribute('data-index'));
                const currentTasks = storage.get('tasks', []);
                if (currentTasks[index]) {
                    currentTasks[index].done = !currentTasks[index].done;
                    state.tasks = currentTasks;
                    storage.set('tasks', state.tasks);
                    renderTasks();
                }
            });
        });

        document.querySelectorAll('.task-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                const currentTasks = storage.get('tasks', []);
                currentTasks.splice(index, 1);
                state.tasks = currentTasks;
                storage.set('tasks', state.tasks);
                renderTasks();
            });
        });
    }

    el.addTaskBtn.onclick = () => {
        const text = el.taskInput.value;
        if (text) {
            const currentTasks = storage.get('tasks', []);
            currentTasks.push({ text, done: false });
            state.tasks = currentTasks;
            el.taskInput.value = '';
            storage.set('tasks', state.tasks);
            renderTasks();
        }
    };

    el.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') el.addTaskBtn.click();
    });

    // --- Sync Tabs ---
    window.addEventListener('storage', (e) => {
        if (e.key === 'links') {
            state.links = JSON.parse(e.newValue || '[]');
            renderLinks();
        }
        if (e.key === 'tasks') {
            state.tasks = JSON.parse(e.newValue || '[]');
            renderTasks();
        }
        if (e.key === 'notes') {
            state.notes = JSON.parse(e.newValue || '""');
            el.notes.value = state.notes;
        }
        if (e.key === 'settings') {
            state.settings = JSON.parse(e.newValue || '{}');
            document.documentElement.style.setProperty('--bg-image', `url('${state.settings.bgUrl}')`);
            updateClock();
        }
    });

    // --- Notes ---
    el.notes.value = state.notes;
    el.notes.oninput = () => {
        state.notes = el.notes.value;
        storage.set('notes', state.notes);
    };

    // --- Settings & Focus ---
    el.focusModeBtn.onclick = () => {
        document.body.classList.toggle('focus-mode');
        const isFocus = document.body.classList.contains('focus-mode');
        el.focusModeBtn.innerHTML = isFocus ? '<i data-lucide="eye"></i>' : '<i data-lucide="eye-off"></i>';
        createIcons({ icons });
    };

    document.getElementById('settingsBtn').onclick = () => {
        el.settingsModal.classList.add('show');
        document.getElementById('userNameInput').value = state.settings.userName;
        document.getElementById('backgroundImageUrl').value = state.settings.bgUrl;
        document.getElementById('focusMinutes').value = state.settings.focus;
        document.getElementById('shortMinutes').value = state.settings.short;
        document.getElementById('longMinutes').value = state.settings.long;
    };

    document.getElementById('closeSettingsBtn').onclick = () => el.settingsModal.classList.remove('show');

    el.saveSettings.onclick = () => {
        const newName = document.getElementById('userNameInput').value;
        const newBg = document.getElementById('backgroundImageUrl').value;
        const newFocus = parseInt(document.getElementById('focusMinutes').value);
        const newShort = parseInt(document.getElementById('shortMinutes').value);
        const newLong = parseInt(document.getElementById('longMinutes').value);

        // Fetch latest settings to avoid overwriting other tab changes
        const currentSettings = storage.get('settings', state.settings);

        if (newName) currentSettings.userName = newName;
        if (newBg) currentSettings.bgUrl = newBg;
        if (newFocus) currentSettings.focus = newFocus;
        if (newShort) currentSettings.short = newShort;
        if (newLong) currentSettings.long = newLong;

        state.settings = currentSettings;
        storage.set('settings', state.settings);
        document.documentElement.style.setProperty('--bg-image', `url('${state.settings.bgUrl}')`);
        setMode('focus');
        updateClock();
        el.settingsModal.classList.remove('show');
        const toast = document.getElementById('toast');
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 2000);
    };

    // --- Init ---
    setMode('focus');
    renderLinks();
    renderTasks();
    document.documentElement.style.setProperty('--bg-image', `url('${state.settings.bgUrl}')`);
});