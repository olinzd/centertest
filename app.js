const tg = window.Telegram.WebApp;
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTaaYZy0QRh1lFNdFFChF14-feZttFVVEAhHJixI1Aw5Ej7-QQ_OvG3MFUDETzxDqlmw/exec';

// Элементы DOM
const userName = document.getElementById('user-name');
const logoutButton = document.getElementById('logout-button');
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
    initApp();
});

// Инициализация приложения
function initApp() {
    // Авторизация через Telegram
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        currentUser = tg.initDataUnsafe.user;
        localStorage.setItem('tg_user_data', JSON.stringify(currentUser));
    } else {
        // Fallback: проверяем localStorage
        const savedUser = localStorage.getItem('tg_user_data');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        } else {
            // Если нет данных - показываем сообщение
            document.body.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h2>Откройте приложение в Telegram</h2>
                    <p>Это приложение работает только внутри Telegram</p>
                </div>
            `;
            return;
        }
    }

    // Показываем интерфейс
    userName.textContent = `${currentUser.first_name}${currentUser.last_name ? ' ' + currentUser.last_name : ''}`;
    
    // Настройка обработчиков
    logoutButton.addEventListener('click', logout);
    refreshBtn.addEventListener('click', loadShifts);
    monthSelector.addEventListener('change', renderCalendar);

    // Загружаем данные
    loadShifts();
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
    const selectedMonth = monthSelector.value;
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
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
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
        
        dayElement.className = 'calendar-day';
        if (shift) {
            dayElement.classList.add(shift.hours === 12 ? 'long-shift' : 'has-shift');
        }
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            ${shift ? `
                <div class="shift-info">
                    ${shift.hours}ч
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

function logout() {
    localStorage.removeItem('tg_user_data');
    alert('Для входа снова откройте приложение в Telegram');
}

// Отправка данных в бота
function sendDataToBot(data) {
    if (tg && tg.sendData) {
        tg.sendData(JSON.stringify(data));
    }
}
