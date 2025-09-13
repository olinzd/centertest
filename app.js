const tg = window.Telegram.WebApp;
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznML__Y9GlyiWQmUMPmEMHkYYZXutyiOcdJHdzEoEoEh7VtlAmsH8zIl6Yy6ZxQ3EKhQ/exec';

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
        console.log('Загрузка данных для TG ID:', currentUser.id);
        
        // 1. Получаем ID сотрудников
        const idsResponse = await fetch(`${APP_SCRIPT_URL}?function=getEmployeeIds&telegramId=${currentUser.id}`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!idsResponse.ok) {
            throw new Error(`HTTP error! status: ${idsResponse.status}`);
        }
        
        const employeeIds = await idsResponse.json();
        console.log('Найдены ID сотрудников:', employeeIds);
        
        if (employeeIds.length === 0) {
            alert('Сотрудник не найден. Обратитесь к администратору.');
            showLoading(false);
            return;
        }
        
        // 2. Загружаем смены для всех ID
        const allShifts = [];
        for (const id of employeeIds) {
            try {
                const shiftsResponse = await fetch(`${APP_SCRIPT_URL}?function=getShiftsByEmployeeId&employeeId=${id}`, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (shiftsResponse.ok) {
                    const shifts = await shiftsResponse.json();
                    console.log(`Смены для ID ${id}:`, shifts);
                    allShifts.push(...shifts);
                } else {
                    console.warn(`Ошибка для ID ${id}:`, shiftsResponse.status);
                }
            } catch (error) {
                console.warn(`Ошибка загрузки для ID ${id}:`, error);
            }
        }
        
        shiftsData = allShifts;
        console.log('Всего смен:', shiftsData.length);
        renderCalendar();
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Ошибка подключения к серверу. Проверьте консоль для деталей.');
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
