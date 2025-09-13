const tg = window.Telegram.WebApp;
const APP_SCRIPT_URL = 'ВАШ_URL_GOOGLE_APPS_SCRIPT';

// Элементы DOM
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const authButton = document.getElementById('auth-button');
const logoutButton = document.getElementById('logout-button');
const userName = document.getElementById('user-name');
const monthSelector = document.getElementById('month-selector');
const refreshBtn = document.getElementById('refresh-btn');
const calendarGrid = document.getElementById('calendar-grid');
const loading = document.getElementById('loading');

let currentUser = null;
let shiftsData = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    if (tg) {
        tg.expand();
        tg.ready();
    }
    checkAuth();
});

// Проверка авторизации
function checkAuth() {
    const userData = localStorage.getItem('tg_user_data');
    
    if (userData) {
        currentUser = JSON.parse(userData);
        showMainInterface();
        loadShifts();
    } else if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentUser = tg.initDataUnsafe.user;
        saveUserData(currentUser);
        showMainInterface();
        loadShifts();
    } else {
        showAuthSection();
    }
}

// Показать интерфейс авторизации
function showAuthSection() {
    authSection.classList.remove('hidden');
    mainSection.classList.add('hidden');
    
    authButton.addEventListener('click', function() {
        alert('Откройте приложение в Telegram для авторизации');
    });
}

// Показать основной интерфейс
function showMainInterface() {
    authSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
    
    userName.textContent = `${currentUser.first_name}${currentUser.last_name ? ' ' + currentUser.last_name : ''}`;
    
    // Настройка обработчиков
    logoutButton.addEventListener('click', logout);
    refreshBtn.addEventListener('click', loadShifts);
    monthSelector.addEventListener('change', renderCalendar);
}

// Загрузка смен
async function loadShifts() {
    showLoading(true);
    
    try {
        // 1. Получаем ID сотрудников по Telegram ID
        const idsResponse = await fetch(`${APP_SCRIPT_URL}?function=getEmployeeIds&telegramId=${currentUser.id}`);
        const employeeIds = await idsResponse.json();
        
        if (employeeIds.length === 0) {
            alert('Сотрудник не найден. Обратитесь к администратору.');
            showLoading(false);
            return;
        }
        
        // 2. Загружаем смены для всех ID
        const allShifts = [];
        for (const id of employeeIds) {
            const shiftsResponse = await fetch(`${APP_SCRIPT_URL}?function=getShiftsByEmployeeId&employeeId=${id}`);
            const shifts = await shiftsResponse.json();
            allShifts.push(...shifts);
        }
        
        shiftsData = allShifts;
        renderCalendar();
        
    } catch (error) {
        console.error('Ошибка загрузки смен:', error);
        alert('Ошибка загрузки данных. Проверьте подключение.');
    } finally {
        showLoading(false);
    }
}

// Отображение календаря
function renderCalendar() {
    const selectedMonth = monthSelector.value; // Формат: "2025-09"
    const [year, month] = selectedMonth.split('-').map(Number);
    
    // Фильтруем смены по выбранному месяцу
    const monthShifts = shiftsData.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.getFullYear() === year && shiftDate.getMonth() + 1 === month;
    });
    
    // Создаем календарь
    calendarGrid.innerHTML = '';
    
    // Первый день месяца
    const firstDay = new Date(year, month - 1, 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Приводим к Пн=0, Вс=6
    
    // Пустые ячейки перед первым днем
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Дни месяца
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const shift = monthShifts.find(s => s.date === dateStr);
        
        // Определяем день недели
        const currentDate = new Date(year, month - 1, day);
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        
        dayElement.className = 'calendar-day';
        if (isWeekend) dayElement.classList.add('weekend');
        if (shift) dayElement.classList.add(shift.hours === 12 ? 'long-shift' : 'has-shift');
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            ${shift ? `
                <div class="shift-info">
                    ${shift.hours}ч<br>
                    ${shift.shift_type}
                </div>
            ` : ''}
        `;
        
        calendarGrid.appendChild(dayElement);
    }
}

// Вспомогательные функции
function showLoading(show) {
    loading.classList.toggle('hidden', !show);
}

function saveUserData(user) {
    localStorage.setItem('tg_user_data', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('tg_user_data');
    currentUser = null;
    showAuthSection();
}

// Отправка данных в бота (если нужно)
function sendDataToBot(data) {
    if (tg && tg.sendData) {
        tg.sendData(JSON.stringify(data));
    }
}
