// ============================================
// DATA MANAGEMENT
// ============================================

class DataManager {
    constructor() {
        this.loadData();
    }

    loadData() {
        this.events = JSON.parse(localStorage.getItem('4w_events')) || {};
        this.todos = JSON.parse(localStorage.getItem('4w_todos')) || [];
        this.attendance = JSON.parse(localStorage.getItem('4w_attendance')) || [];
        this.contacts = JSON.parse(localStorage.getItem('4w_contacts')) || [];
        this.currentWeekOffset = 0;
    }

    saveData() {
        localStorage.setItem('4w_events', JSON.stringify(this.events));
        localStorage.setItem('4w_todos', JSON.stringify(this.todos));
        localStorage.setItem('4w_attendance', JSON.stringify(this.attendance));
        localStorage.setItem('4w_contacts', JSON.stringify(this.contacts));
    }

    addEvent(dayOfWeek, time, name) {
        const dateKey = this.getDateKey(dayOfWeek);
        if (!this.events[dateKey]) {
            this.events[dateKey] = [];
        }
        this.events[dateKey].push({ time, name, id: Date.now() });
        this.events[dateKey].sort((a, b) => a.time.localeCompare(b.time));
        this.saveData();
    }

    removeEvent(dayOfWeek, eventId) {
        const dateKey = this.getDateKey(dayOfWeek);
        if (this.events[dateKey]) {
            this.events[dateKey] = this.events[dateKey].filter(e => e.id !== eventId);
            this.saveData();
        }
    }

    getEventsForDay(dayOfWeek) {
        const dateKey = this.getDateKey(dayOfWeek);
        return this.events[dateKey] || [];
    }

    addTodo(text) {
        this.todos.push({
            id: Date.now(),
            text,
            completed: false
        });
        this.saveData();
    }

    removeTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveData();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveData();
        }
    }

    addAttendance(name) {
        this.attendance.push({
            id: Date.now(),
            name,
            status: 'present' // present, absent
        });
        this.saveData();
    }

    removeAttendance(id) {
        this.attendance = this.attendance.filter(a => a.id !== id);
        this.saveData();
    }

    toggleAttendanceStatus(id) {
        const item = this.attendance.find(a => a.id === id);
        if (item) {
            item.status = item.status === 'present' ? 'absent' : 'present';
            this.saveData();
        }
    }

    addContact(name, phone) {
        this.contacts.push({
            id: Date.now(),
            name,
            phone
        });
        this.saveData();
    }

    removeContact(id) {
        this.contacts = this.contacts.filter(c => c.id !== id);
        this.saveData();
    }

    searchContacts(query) {
        const q = query.toLowerCase();
        return this.contacts.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q)
        );
    }

    getDateKey(dayOfWeek) {
        const today = new Date();
        const dayOfWeekToday = today.getDay();
        const offset = dayOfWeek - (dayOfWeekToday === 0 ? 6 : dayOfWeekToday - 1);
        const date = new Date(today);
        date.setDate(today.getDate() + offset + (this.currentWeekOffset * 7));
        return date.toISOString().split('T')[0];
    }

    getWeekDates() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - offset + (this.currentWeekOffset * 7));

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date);
        }
        return dates;
    }

    getWeekDisplay() {
        const dates = this.getWeekDates();
        const start = dates[0];
        const end = dates[6];
        const monthStart = start.toLocaleDateString('vi-VN', { month: 'long' });
        const monthEnd = end.toLocaleDateString('vi-VN', { month: 'long' });
        const yearStart = start.getFullYear();
        const yearEnd = end.getFullYear();

        if (monthStart === monthEnd && yearStart === yearEnd) {
            return `${start.getDate()} - ${end.getDate()} ${monthStart} ${yearStart}`;
        }
        return `${start.getDate()} ${monthStart} - ${end.getDate()} ${monthEnd}`;
    }
}

// ============================================
// UI MANAGEMENT
// ============================================

class UIManager {
    constructor(dataManager) {
        this.data = dataManager;
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Calendar
        document.getElementById('prevWeek').addEventListener('click', () => this.previousWeek());
        document.getElementById('nextWeek').addEventListener('click', () => this.nextWeek());
        document.getElementById('addEventBtn').addEventListener('click', () => this.addEvent());

        // Todo
        document.getElementById('addTodoBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Attendance
        document.getElementById('addAttendanceBtn').addEventListener('click', () => this.addAttendance());
        document.getElementById('attendanceName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addAttendance();
        });

        // Contacts
        document.getElementById('addContactBtn').addEventListener('click', () => this.addContact());
        document.getElementById('contactName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addContact();
        });
        document.getElementById('searchContact').addEventListener('input', (e) => this.searchContacts(e.target.value));
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    render() {
        this.renderCalendar();
        this.renderTodoList();
        this.renderAttendance();
        this.renderContacts();
    }

    // Calendar Functions
    renderCalendar() {
        const weekDates = this.data.getWeekDates();
        document.getElementById('weekDisplay').textContent = this.data.getWeekDisplay();

        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.innerHTML = '';

        const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

        weekDates.forEach((date, index) => {
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';

            const dayName = document.createElement('div');
            dayName.className = 'day-name';
            dayName.textContent = dayNames[index];

            const dayDate = document.createElement('div');
            dayDate.className = 'day-date';
            dayDate.textContent = date.getDate() + '/' + (date.getMonth() + 1);

            const dayEvents = document.createElement('div');
            dayEvents.className = 'day-events';

            const events = this.data.getEventsForDay(index);
            if (events.length === 0) {
                dayEvents.innerHTML = '<em style="color: #ccc;">Không có sự kiện</em>';
            } else {
                dayEvents.innerHTML = events.map(event => `
                    <div class="event-item">
                        <div class="event-time">${event.time}</div>
                        <div>${event.name}</div>
                        <button class="btn-small btn-danger" onclick="app.removeEventUI(${index}, ${event.id})">Xóa</button>
                    </div>
                `).join('');
            }

            dayCard.appendChild(dayName);
            dayCard.appendChild(dayDate);
            dayCard.appendChild(dayEvents);
            calendarGrid.appendChild(dayCard);
        });

        this.renderEventsList();
    }

    renderEventsList() {
        const eventsList = document.getElementById('eventsList');
        const allEvents = [];

        const weekDates = this.data.getWeekDates();
        const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

        weekDates.forEach((date, dayIndex) => {
            const events = this.data.getEventsForDay(dayIndex);
            events.forEach(event => {
                allEvents.push({
                    day: dayNames[dayIndex],
                    date: date,
                    ...event,
                    dayIndex
                });
            });
        });

        allEvents.sort((a, b) => a.time.localeCompare(b.time));

        if (allEvents.length === 0) {
            eventsList.innerHTML = '<p style="color: #ccc; text-align: center;">Không có sự kiện nào trong tuần</p>';
        } else {
            eventsList.innerHTML = allEvents.map(event => `
                <div class="event-item-full">
                    <div>
                        <strong>${event.day}</strong> ${event.date.getDate()}/${event.date.getMonth() + 1} - 
                        <span class="event-time">${event.time}</span>: ${event.name}
                    </div>
                    <button class="btn-small btn-danger" onclick="app.removeEventUI(${event.dayIndex}, ${event.id})">Xóa</button>
                </div>
            `).join('');
        }
    }

    addEvent() {
        const day = parseInt(document.getElementById('eventDay').value);
        const time = document.getElementById('eventTime').value;
        const name = document.getElementById('eventName').value;

        if (!time || !name) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        this.data.addEvent(day, time, name);
        document.getElementById('eventTime').value = '';
        document.getElementById('eventName').value = '';
        this.renderCalendar();
    }

    removeEventUI(dayOfWeek, eventId) {
        this.data.removeEvent(dayOfWeek, eventId);
        this.renderCalendar();
    }

    previousWeek() {
        this.data.currentWeekOffset--;
        this.renderCalendar();
    }

    nextWeek() {
        this.data.currentWeekOffset++;
        this.renderCalendar();
    }

    // Todo Functions
    renderTodoList() {
        const todoList = document.getElementById('todoList');
        if (this.data.todos.length === 0) {
            todoList.innerHTML = '<li style="text-align: center; color: #ccc; padding: 20px;">Không có công việc nào</li>';
        } else {
            todoList.innerHTML = this.data.todos.map(todo => `
                <li class="todo-item ${todo.completed ? 'completed' : ''}">
                    <div class="todo-item-content">
                        <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="app.toggleTodo(${todo.id})">
                        <span>${todo.text}</span>
                    </div>
                    <div class="todo-item-actions">
                        <button class="btn-small btn-danger" onclick="app.removeTodo(${todo.id})">Xóa</button>
                    </div>
                </li>
            `).join('');
        }
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();
        if (!text) {
            alert('Vui lòng nhập công việc');
            return;
        }
        this.data.addTodo(text);
        input.value = '';
        this.renderTodoList();
    }

    removeTodo(id) {
        this.data.removeTodo(id);
        this.renderTodoList();
    }

    toggleTodo(id) {
        this.data.toggleTodo(id);
        this.renderTodoList();
    }

    // Attendance Functions
    renderAttendance() {
        const attendanceList = document.getElementById('attendanceList');
        if (this.data.attendance.length === 0) {
            attendanceList.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ccc;">Chưa có thành viên nào</td></tr>';
        } else {
            attendanceList.innerHTML = this.data.attendance.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>
                        <span class="status-${item.status}">
                            ${item.status === 'present' ? '✓ Có mặt' : '✗ Vắng'}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-small btn-success" onclick="app.toggleAttendanceStatus(${item.id})">
                                ${item.status === 'present' ? 'Vắng' : 'Có mặt'}
                            </button>
                            <button class="btn-small btn-danger" onclick="app.removeAttendance(${item.id})">Xóa</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    addAttendance() {
        const name = document.getElementById('attendanceName').value.trim();
        if (!name) {
            alert('Vui lòng nhập tên');
            return;
        }
        this.data.addAttendance(name);
        document.getElementById('attendanceName').value = '';
        this.renderAttendance();
    }

    removeAttendance(id) {
        this.data.removeAttendance(id);
        this.renderAttendance();
    }

    toggleAttendanceStatus(id) {
        this.data.toggleAttendanceStatus(id);
        this.renderAttendance();
    }

    // Contacts Functions
    renderContacts() {
        const contactsList = document.getElementById('contactsList');
        const searchQuery = document.getElementById('searchContact').value;
        const contacts = searchQuery ? this.data.searchContacts(searchQuery) : this.data.contacts;

        if (contacts.length === 0) {
            contactsList.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ccc;">Không có liên hệ nào</td></tr>';
        } else {
            contactsList.innerHTML = contacts.map(contact => `
                <tr>
                    <td>${contact.name}</td>
                    <td>${contact.phone}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-small btn-danger" onclick="app.removeContact(${contact.id})">Xóa</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    addContact() {
        const name = document.getElementById('contactName').value.trim();
        const phone = document.getElementById('contactPhone').value.trim();

        if (!name || !phone) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        this.data.addContact(name, phone);
        document.getElementById('contactName').value = '';
        document.getElementById('contactPhone').value = '';
        this.renderContacts();
    }

    removeContact(id) {
        this.data.removeContact(id);
        this.renderContacts();
    }

    searchContacts(query) {
        this.renderContacts();
    }
}

// ============================================
// INITIALIZATION
// ============================================

let app;
document.addEventListener('DOMContentLoaded', () => {
    const dataManager = new DataManager();
    app = new UIManager(dataManager);
});
