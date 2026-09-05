const Storage = {
    get(key, def = null) {
        try {
            const data = localStorage.getItem('ss_' + key);
            return data ? JSON.parse(data) : def;
        } catch(e) {
            return def;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem('ss_' + key, JSON.stringify(value));
        } catch(e) {
            console.error('Ошибка сохранения');
        }
    }
};

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    if (type === 'error') toast.style.background = '#e74c3c';
    if (type === 'success') toast.style.background = '#27ae60';
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.nav-btn, .card').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) btn.classList.add('active');
    });
}

document.querySelectorAll('.nav-btn, .card').forEach(btn => {
    btn.addEventListener('click', function() {
        if (this.dataset.page) navigateTo(this.dataset.page);
    });
});

// Приветствие
const savedUser = Storage.get('user');
if (savedUser) {
    document.getElementById('welcomeScreen').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
    document.getElementById('greeting').textContent = 'Добро пожаловать, ' + savedUser.name + '!';
    document.getElementById('settingsName').value = savedUser.name;
}

document.getElementById('welcomeBtn').addEventListener('click', function() {
    const name = document.getElementById('userName').value.trim();
    if (name) {
        Storage.set('user', {name: name});
        document.getElementById('welcomeScreen').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        document.getElementById('greeting').textContent = 'Добро пожаловать, ' + name + '!';
        document.getElementById('settingsName').value = name;
        navigateTo('home');
    } else {
        document.getElementById('welcomeError').textContent = 'Введите имя!';
    }
});

// Книги
let books = Storage.get('books', []);

document.getElementById('addBookBtn').addEventListener('click', function() {
    document.getElementById('bookFileInput').click();
});

document.getElementById('bookFileInput').addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 0) {
        let added = 0;
        for (let file of files) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (['png', 'jpg', 'jpeg', 'pdf', 'txt', 'fb2', 'epub', 'djvu'].includes(ext)) {
                const exists = books.some(function(b) { return b.fileName === file.name; });
                if (!exists) {
                    const fileUrl = URL.createObjectURL(file);
                    books.push({
                        id: Date.now() + Math.random(),
                        name: file.name.replace(/\.[^.]+$/, ''),
                        fileName: file.name,
                        fileUrl: fileUrl,
                        extension: ext,
                        favorite: false
                    });
                    added++;
                }
            }
        }
        Storage.set('books', books);
        renderBooks();
        showToast('Добавлено книг: ' + added, 'success');
    }
});

// Загрузка книг с GitHub Pages
function loadBooksFromGitHub() {
    fetch('books/')
        .then(function(response) {
            if (!response.ok) return;
            return response.text();
        })
        .then(function(html) {
            if (!html) return;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            let added = 0;
            links.forEach(function(link) {
                const href = link.getAttribute('href');
                if (href && !href.includes('../') && href !== './' && href !== '../') {
                    let fileName = href.replace('/', '');
                    if (fileName && fileName.includes('.')) {
                        fileName = decodeURIComponent(fileName);
                        const exists = books.some(function(b) { return b.fileName === fileName; });
                        if (!exists) {
                            const ext = fileName.split('.').pop().toLowerCase();
                            if (['png', 'jpg', 'jpeg', 'pdf', 'txt', 'fb2', 'epub', 'djvu'].includes(ext)) {
                                books.push({
                                    id: Date.now() + Math.random(),
                                    name: fileName.replace(/\.[^.]+$/, ''),
                                    fileName: fileName,
                                    fileUrl: 'books/' + fileName,
                                    extension: ext,
                                    favorite: false
                                });
                                added++;
                            }
                        }
                    }
                }
            });
            
            if (added > 0) {
                Storage.set('books', books);
                renderBooks();
                showToast('Загружено книг с сервера: ' + added, 'success');
            }
        })
        .catch(function() {
            console.log('GitHub Pages не доступен, используем локальные книги');
        });
}

// Поиск книг
document.getElementById('bookSearch').addEventListener('input', function() {
    renderBooks();
});

function renderBooks() {
    const container = document.getElementById('booksList');
    const searchQuery = document.getElementById('bookSearch') ? document.getElementById('bookSearch').value.toLowerCase() : '';
    
    let filteredBooks = books;
    if (searchQuery) {
        filteredBooks = books.filter(function(book) {
            return book.name.toLowerCase().includes(searchQuery) || 
                   book.fileName.toLowerCase().includes(searchQuery);
        });
    }
    
    if (!filteredBooks.length) {
        container.innerHTML = '<p style="text-align:center;color:#999;">Книги не найдены</p>';
        return;
    }
    
    container.innerHTML = filteredBooks.map(function(book) {
        return '<div class="card">' +
            '<h3>' + book.name + '</h3>' +
            '<p>' + book.fileName + '</p>' +
            '<p style="font-size:12px;color:#999;">Формат: ' + book.extension.toUpperCase() + '</p>' +
            '<button class="btn" onclick="openBook(' + book.id + ')">Открыть</button>' +
            '<button class="btn" onclick="toggleFav(' + book.id + ')">' + (book.favorite ? 'В избранном' : 'В избранное') + '</button>' +
            '<button class="btn" onclick="removeBook(' + book.id + ')">Удалить</button>' +
        '</div>';
    }).join('');
}

function openBook(id) {
    const book = books.find(function(b) { return b.id === id; });
    if (book && book.fileUrl) {
        window.open(book.fileUrl, '_blank');
    }
}

function toggleFav(id) {
    const book = books.find(function(b) { return b.id === id; });
    if (book) {
        book.favorite = !book.favorite;
        Storage.set('books', books);
        renderBooks();
    }
}

function removeBook(id) {
    if (confirm('Удалить книгу?')) {
        books = books.filter(function(b) { return b.id !== id; });
        Storage.set('books', books);
        renderBooks();
        showToast('Книга удалена', 'success');
    }
}

// Решение
let selectedSubject = null;
let needExplanation = null;

document.querySelectorAll('.subject-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.subject-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        selectedSubject = btn.dataset.subject;
    });
});

document.getElementById('needExplanationYes').addEventListener('click', function() {
    needExplanation = true;
    this.style.background = 'var(--primary)';
    document.getElementById('needExplanationNo').style.background = '';
});

document.getElementById('needExplanationNo').addEventListener('click', function() {
    needExplanation = false;
    this.style.background = 'var(--primary)';
    document.getElementById('needExplanationYes').style.background = '';
});

// Обычное решение
document.getElementById('solveBtn').addEventListener('click', function() {
    const task = document.getElementById('taskInput').value.trim();
    
    if (!task) {
        showToast('Введите задание!', 'error');
        return;
    }
    if (!selectedSubject) {
        showToast('Выберите предмет!', 'error');
        return;
    }
    if (needExplanation === null) {
        showToast('Укажите, нужно ли объяснение!', 'error');
        return;
    }
    
    const prompt = 'Предмет: ' + selectedSubject + '\nЗадание: ' + task + '\n' + (needExplanation ? 'Нужно подробное объяснение' : 'Нужен только ответ');
    
    Storage.set('lastTask', {prompt: prompt});
    
    const chatGptUrl = 'https://chat.openai.com/?prompt=' + encodeURIComponent(prompt);
    
    document.getElementById('solutionResult').innerHTML = 
        '<div class="card" style="margin-top:20px;">' +
            '<h3>Готовый промт:</h3>' +
            '<pre style="white-space:pre-wrap;">' + prompt + '</pre>' +
            '<button class="btn" onclick="copyPrompt()">Копировать</button>' +
            '<a href="' + chatGptUrl + '" target="_blank" class="btn" style="text-decoration:none;display:inline-block;">Открыть в ChatGPT</a>' +
        '</div>';
});

// Решение через ИИ
document.getElementById('aiSolveBtn').addEventListener('click', function() {
    const task = document.getElementById('taskInput').value.trim();
    
    if (!task) {
        showToast('Введите задание!', 'error');
        return;
    }
    if (!selectedSubject) {
        showToast('Выберите предмет!', 'error');
        return;
    }
    if (needExplanation === null) {
        showToast('Укажите, нужно ли объяснение!', 'error');
        return;
    }
    
    const apiKey = Storage.get('chatgpt_api_key', '');
    
    if (!apiKey) {
        showToast('Введите API ключ в настройках!', 'error');
        return;
    }
    
    const aiResult = document.getElementById('aiResult');
    aiResult.innerHTML = '<div class="loading">Запрос к ИИ...</div>';
    
    const prompt = 'Ты - опытный учитель. ' +
        'Предмет: ' + selectedSubject + '. ' +
        'Задание: ' + task + '. ' +
        (needExplanation ? 'Объясни подробно, шаг за шагом, как решать это задание. Расскажи все правила и формулы.' : 'Дай только ответ без объяснений.');
    
    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {role: 'system', content: 'Ты - опытный учитель, который помогает школьникам.'},
                {role: 'user', content: prompt}
            ],
            max_tokens: 1000
        })
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Ошибка API: ' + response.status);
        }
        return response.json();
    })
    .then(function(data) {
        const answer = data.choices[0].message.content;
        aiResult.innerHTML = '<div class="ai-response">' + answer.replace(/\n/g, '<br>') + '</div>';
    })
    .catch(function(error) {
        aiResult.innerHTML = '<div class="card" style="margin-top:20px;color:red;">Ошибка: ' + error.message + '</div>';
    });
});

function copyPrompt() {
    const data = Storage.get('lastTask');
    if (data) {
        navigator.clipboard.writeText(data.prompt);
        showToast('Скопировано!', 'success');
    }
}

// Промты
let prompts = Storage.get('prompts', []);
let editingId = null;

document.getElementById('addPromptBtn').addEventListener('click', function() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Добавить промт';
    document.getElementById('promptName').value = '';
    document.getElementById('promptText').value = '';
    document.getElementById('modalOverlay').classList.add('active');
});

document.getElementById('cancelModalBtn').addEventListener('click', function() {
    document.getElementById('modalOverlay').classList.remove('active');
});

document.getElementById('saveModalBtn').addEventListener('click', function() {
    const name = document.getElementById('promptName').value.trim();
    const text = document.getElementById('promptText').value.trim();
    const ai = document.getElementById('promptAI').value;
    
    if (!name || !text) {
        showToast('Заполните все поля!', 'error');
        return;
    }
    
    if (editingId) {
        const p = prompts.find(function(x) { return x.id === editingId; });
        if (p) {
            p.name = name;
            p.text = text;
            p.ai = ai;
        }
        showToast('Промт обновлён!', 'success');
    } else {
        prompts.push({id: Date.now(), name: name, text: text, ai: ai});
        showToast('Промт сохранён!', 'success');
    }
    
    Storage.set('prompts', prompts);
    document.getElementById('modalOverlay').classList.remove('active');
    renderPrompts();
});

function renderPrompts() {
    const container = document.getElementById('promptsList');
    if (!prompts.length) {
        container.innerHTML = '<p style="text-align:center;color:#999;">Нет промтов</p>';
        return;
    }
    container.innerHTML = prompts.map(function(p) {
        return '<div class="card">' +
            '<h3>' + p.name + '</h3>' +
            '<p>' + p.ai + '</p>' +
            '<button class="btn" onclick="editPrompt(' + p.id + ')">Изменить</button>' +
            '<button class="btn" onclick="deletePrompt(' + p.id + ')">Удалить</button>' +
            '<button class="btn" onclick="copyPromptText(' + p.id + ')">Копировать</button>' +
        '</div>';
    }).join('');
}

function editPrompt(id) {
    const p = prompts.find(function(x) { return x.id === id; });
    if (p) {
        editingId = id;
        document.getElementById('modalTitle').textContent = 'Изменить промт';
        document.getElementById('promptName').value = p.name;
        document.getElementById('promptText').value = p.text;
        document.getElementById('promptAI').value = p.ai;
        document.getElementById('modalOverlay').classList.add('active');
    }
}

function deletePrompt(id) {
    if (confirm('Удалить промт?')) {
        prompts = prompts.filter(function(p) { return p.id !== id; });
        Storage.set('prompts', prompts);
        renderPrompts();
        showToast('Промт удалён!', 'success');
    }
}

function copyPromptText(id) {
    const p = prompts.find(function(x) { return x.id === id; });
    if (p) {
        navigator.clipboard.writeText(p.text);
        showToast('Скопировано!', 'success');
    }
}

// Расписание
let schedule = Storage.get('schedule', {});
let currentDay = 'monday';

document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentDay = btn.dataset.day;
        renderSchedule();
    });
});

document.getElementById('uploadScheduleBtn').addEventListener('click', function() {
    document.getElementById('scheduleFileInput').click();
});

document.getElementById('scheduleFileInput').addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 0) {
        for (let file of files) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const fileName = file.name.toLowerCase();
                let dayKey = null;
                
                if (fileName.includes('monday') || fileName.includes('пон')) dayKey = 'monday';
                if (fileName.includes('tuesday') || fileName.includes('вт')) dayKey = 'tuesday';
                if (fileName.includes('wednesday') || fileName.includes('ср')) dayKey = 'wednesday';
                if (fileName.includes('thursday') || fileName.includes('чт')) dayKey = 'thursday';
                if (fileName.includes('friday') || fileName.includes('пт')) dayKey = 'friday';
                
                if (dayKey) {
                    schedule[dayKey] = ev.target.result.split('\n').filter(function(l) { return l.trim(); });
                }
                
                Storage.set('schedule', schedule);
                renderSchedule();
                showToast('Расписание загружено!', 'success');
            };
            reader.readAsText(file);
        }
    }
});

document.getElementById('clearScheduleBtn').addEventListener('click', function() {
    if (confirm('Очистить расписание?')) {
        schedule = {};
        Storage.set('schedule', schedule);
        renderSchedule();
        showToast('Расписание очищено', 'success');
    }
});

function renderSchedule() {
    const container = document.getElementById('scheduleContent');
    const lessons = schedule[currentDay] || [];
    if (!lessons.length) {
        container.innerHTML = '<p style="text-align:center;color:#999;">Нет уроков</p>';
        return;
    }
    container.innerHTML = lessons.map(function(lesson, i) {
        return '<div class="card" style="margin-bottom:10px;"><strong>Урок ' + (i+1) + ':</strong> ' + lesson + '</div>';
    }).join('');
}

// Настройки
document.getElementById('saveNameBtn').addEventListener('click', function() {
    const name = document.getElementById('settingsName').value.trim();
    if (name) {
        Storage.set('user', {name: name});
        document.getElementById('greeting').textContent = 'Добро пожаловать, ' + name + '!';
        showToast('Имя сохранено!', 'success');
    }
});

document.querySelectorAll('.theme-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.body.dataset.theme = btn.dataset.theme;
        Storage.set('theme', btn.dataset.theme);
    });
});

const colors = {
    default: ['#667eea', '#764ba2'],
    red: ['#e74c3c', '#c0392b'],
    blue: ['#3498db', '#2980b9'],
    green: ['#27ae60', '#229954'],
    orange: ['#e67e22', '#d35400']
};

document.querySelectorAll('.color-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        const color = btn.dataset.color;
        if (color === 'rgb') {
            document.body.style.animation = 'rgbShift 5s linear infinite';
        } else {
            document.body.style.animation = 'none';
            const c = colors[color] || colors.default;
            document.documentElement.style.setProperty('--primary', c[0]);
            document.documentElement.style.setProperty('--secondary', c[1]);
        }
        Storage.set('color', color);
    });
});

// Сохранение API ключей
document.getElementById('saveApiKeysBtn').addEventListener('click', function() {
    const chatgptKey = document.getElementById('chatgptApiKey').value.trim();
    const grokKey = document.getElementById('grokApiKey').value.trim();
    
    if (chatgptKey) Storage.set('chatgpt_api_key', chatgptKey);
    if (grokKey) Storage.set('grok_api_key', grokKey);
    
    showToast('API ключи сохранены!', 'success');
});

// Загрузка API ключей
const savedChatgptKey = Storage.get('chatgpt_api_key', '');
const savedGrokKey = Storage.get('grok_api_key', '');
if (savedChatgptKey) document.getElementById('chatgptApiKey').value = savedChatgptKey;
if (savedGrokKey) document.getElementById('grokApiKey').value = savedGrokKey;

// Инициализация
renderBooks();
renderPrompts();
renderSchedule();
loadBooksFromGitHub();

const theme = Storage.get('theme', 'light');
document.body.dataset.theme = theme;

const color = Storage.get('color', 'default');
if (color === 'rgb') {
    document.body.style.animation = 'rgbShift 5s linear infinite';
} else {
    const c = colors[color] || colors.default;
    document.documentElement.style.setProperty('--primary', c[0]);
    document.documentElement.style.setProperty('--secondary', c[1]);
}