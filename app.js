// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;

// Элементы DOM
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const authButton = document.getElementById('auth-button');
const logoutButton = document.getElementById('logout-button');
const userName = document.getElementById('user-name');
const userId = document.getElementById('user-id');
const userUsername = document.getElementById('user-username');

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', function() {
    tg.expand(); // Развернуть приложение на весь экран
    checkAuth();
});

// Функция проверки авторизации
function checkAuth() {
    const userData = localStorage.getItem('tg_user_data');
    
    if (userData) {
        // Пользователь уже авторизован
        const user = JSON.parse(userData);
        showUserData(user);
    } else if (tg.initDataUnsafe.user) {
        // Пользователь открыл приложение из Telegram
        const user = tg.initDataUnsafe.user;
        saveUserData(user);
        showUserData(user);
    } else {
        // Пользователь не авторизован
        showAuthButton();
    }
}

// Показать данные пользователя
function showUserData(user) {
    authSection.classList.add('hidden');
    userSection.classList.remove('hidden');
    
    userName.textContent = `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
    userId.textContent = user.id;
    userUsername.textContent = user.username || 'отсутствует';
}

// Показать кнопку авторизации
function showAuthButton() {
    authSection.classList.remove('hidden');
    userSection.classList.add('hidden');
    
    authButton.addEventListener('click', function() {
        // В мини-приложении авторизация происходит автоматически
        // Эта кнопка нужна для случаев, когда приложение открыто вне Telegram
        alert('Откройте это приложение в Telegram для авторизации');
    });
}

// Сохранить данные пользователя
function saveUserData(user) {
    localStorage.setItem('tg_user_data', JSON.stringify(user));
}

// Выход из аккаунта
logoutButton.addEventListener('click', function() {
    localStorage.removeItem('tg_user_data');
    showAuthButton();
});

// Отправка данных в бота (если нужно)
function sendDataToBot(data) {
    tg.sendData(JSON.stringify(data));
}

// Готовность приложения
tg.ready();
// Добавляем эти переменные
const updateButton = document.getElementById('update-button');
const adminPanel = document.getElementById('admin-panel');
const parseDataButton = document.getElementById('parse-data-button');
const updateResult = document.getElementById('update-result');

// Конфигурация
const APP_SCRIPT_URL = 'https://script.google.com/.../exec'; // Ваш URL Apps Script

// В функции showUserData добавляем проверку роли
async function showUserData(user) {
    authSection.classList.add('hidden');
    userSection.classList.remove('hidden');
    
    userName.textContent = `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
    userId.textContent = user.id;
    userUsername.textContent = user.username || 'отсутствует';
    
    // Проверяем роль пользователя
    const userRole = await checkUserRole(user.id);
    if (userRole.role === 'Управляющий' || userRole.role === 'Заместитель') {
        updateButton.classList.remove('hidden');
        adminPanel.classList.remove('hidden');
    }
}

// Функция проверки роли пользователя
async function checkUserRole(telegramId) {
    try {
        const response = await fetch(`${APP_SCRIPT_URL}?function=getUserRole&telegramId=${telegramId}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка проверки роли:', error);
        return { role: '' };
    }
}

// Функция обновления данных
async function updateScheduleData() {
    const userData = JSON.parse(localStorage.getItem('tg_user_data'));
    
    if (!userData) {
        alert('Пользователь не авторизован');
        return;
    }
    
    parseDataButton.disabled = true;
    updateResult.innerHTML = 'Обновление...';
    
    try {
        const response = await fetch(`${APP_SCRIPT_URL}?function=parseSchedule&telegramId=${userData.id}`);
        const result = await response.json();
        
        if (result.success) {
            updateResult.innerHTML = `✅ ${result.message}<br>Обновил: ${result.updatedBy}`;
        } else {
            updateResult.innerHTML = `❌ ${result.error}`;
        }
    } catch (error) {
        updateResult.innerHTML = '❌ Ошибка соединения';
    } finally {
        parseDataButton.disabled = false;
        
        // Автоматически скрываем результат через 5 секунд
        setTimeout(() => {
            updateResult.innerHTML = '';
        }, 5000);
    }
}

// Назначаем обработчик кнопки
parseDataButton.addEventListener('click', updateScheduleData);

// Функция для отправки данных в бота (если нужно)
function sendDataToBot(data) {
    if (tg && tg.sendData) {
        tg.sendData(JSON.stringify(data));
    }
}

// Готовность приложения
if (tg) {
    tg.ready();
}
