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
