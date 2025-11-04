import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

document.addEventListener('DOMContentLoaded', () => {
    // --- THEME MANAGER ---
    const themeManager = (() => {
        const themeSwitcher = document.querySelector('.theme-switcher');
        const body = document.body;

        const applyTheme = (theme) => {
            body.classList.remove('dark-theme');
            if (theme === 'dark') {
                body.classList.add('dark-theme');
            }
        };

        const getSystemPreference = () => {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        };

        const updateActiveButton = (theme) => {
            if (!themeSwitcher) return;
            themeSwitcher.querySelectorAll('button').forEach(btn => {
                if (btn.dataset.theme === theme) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        };

        const init = () => {
            if (!themeSwitcher) return;

            themeSwitcher.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (target) {
                    const chosenTheme = target.dataset.theme;
                    localStorage.setItem('themePreference', chosenTheme);
                    applyTheme(chosenTheme);
                    updateActiveButton(chosenTheme);
                }
            });

            const savedTheme = localStorage.getItem('themePreference');
            if (savedTheme) {
                applyTheme(savedTheme);
                updateActiveButton(savedTheme);
            } else {
                const systemTheme = getSystemPreference();
                applyTheme(systemTheme);
                // No active button when using system preference by default
                updateActiveButton(null); 
            }
        };

        return { init };
    })();


    // --- SUPABASE & APP LOGIC ---
    const supabaseUrl = "https://cwdrrdgllpxysqmxnavn.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZHJyZGdsbHB4eXNxbXhuYXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTUxNDYsImV4cCI6MjA3NzU3MTE0Nn0.2tv_Orp33adsPKZzeNYAc06cuwyiu_a1eJEW0xafpeE";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // --- DOM ELEMENTS ---
    const uploadButton = document.getElementById('upload-button');
    const textInput = document.getElementById('text-input');
    const fileInput = document.getElementById('file-input');
    const fileInputLabel = document.querySelector('.file-input-label');
    const fileFeedback = document.getElementById('file-feedback');
    const clipboardContent = document.getElementById('clipboard-content');
    const clearAllButton = document.getElementById('clear-all-button');

    // --- EVENT LISTENERS ---
    themeManager.init();

    uploadButton.addEventListener('click', handleUpload);
    clearAllButton.addEventListener('click', clearAll);
    fileInput.addEventListener('change', handleFileSelection);

    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            uploadButton.click();
        }
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.menu-button')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
                menu.closest('.clipboard-item').classList.remove('menu-open');
            });
        }
    });

    // --- CORE FUNCTIONS ---

    const icons = {
        success: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="none"/><path d="M7 13.5l3 3 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
        error: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="none"/><path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    };

    function showToast(message, type = "success", duration = 3000) {
        const container = document.getElementById("toast-container");

        const toast = document.createElement("div");
        toast.className = `toast toast--${type}`;
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.setAttribute("tabindex", "0");
        toast.innerHTML = `
            <span class="toast__icon">${icons[type] || ""}</span>
            <span>${message}</span>
          `;

        container.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 50);

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    function handleFileSelection() {
        const fileInputLabelSpan = fileInputLabel.querySelector('span');
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileFeedback.textContent = `Archivo: ${fileName}`;
            fileInputLabelSpan.textContent = '✓';
            fileInputLabel.classList.add('file-selected');
        } else {
            resetFileFeedback();
        }
    }

    function resetFileFeedback() {
        const fileInputLabelSpan = fileInputLabel.querySelector('span');
        fileFeedback.textContent = '';
        fileInputLabelSpan.textContent = '+';
        fileInputLabel.classList.remove('file-selected');
        fileInput.value = '';
    }

    async function handleUpload() {
        const text = textInput.value.trim();
        const file = fileInput.files[0];
        
        const uploadButtonSpan = uploadButton.querySelector('span');
        uploadButton.disabled = true;
        uploadButtonSpan.textContent = 'Subiendo...';

        try {
            if (text) {
                await uploadText(text);
                textInput.value = '';
            }

            if (file) {
                await uploadFile(file);
                resetFileFeedback();
            }

            if (!text && !file) {
                showToast('Por favor, escribe un texto o selecciona un archivo.', 'error');
            } else {
                await loadItems();
                showToast('Contenido subido con éxito!', 'success');
            }
        } catch (error) {
            console.error('Error subiendo el contenido:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            uploadButton.disabled = false;
            uploadButtonSpan.textContent = 'Subir';
        }
    }

    async function uploadText(text) {
        const { error } = await supabase.from('items').insert([{ content: text }]);
        if (error) throw error;
    }

    async function uploadFile(file) {
        const fileName = `${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('clipboard').upload(fileName, file);
        if (error) throw error;
    }

    async function loadItems() {
        clipboardContent.innerHTML = '';

        try {
            const [textsResponse, filesResponse] = await Promise.all([
                supabase.from('items').select('id, content, created_at'),
                supabase.storage.from('clipboard').list()
            ]);

            if (textsResponse.error) throw textsResponse.error;
            if (filesResponse.error) throw filesResponse.error;

            const mappedTexts = textsResponse.data.map(item => ({ ...item, type: 'text' }));
            const mappedFiles = filesResponse.data.map(file => ({
                ...file,
                type: 'file',
                publicUrl: supabase.storage.from('clipboard').getPublicUrl(file.name).data.publicUrl
            }));

            const allItems = [...mappedTexts, ...mappedFiles];
            allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            allItems.forEach(item => createAndAppendItem(item));

        } catch (error) {
            console.error('Error cargando elementos:', error);
            showToast('No se pudo cargar el contenido.', 'error');
        }
    }

    async function clearAll() {
        if (!confirm('¿Estás seguro de que quieres borrar TODO el contenido? Esta acción no se puede deshacer.')) return;

        try {
            const { error: deleteTextError } = await supabase.from('items').delete().neq('id', -1);
            if (deleteTextError) throw deleteTextError;

            const { data: files, error: listError } = await supabase.storage.from('clipboard').list();
            if (listError) throw listError;
            if (files.length > 0) {
                const fileNames = files.map(file => file.name);
                const { error: deleteFilesError } = await supabase.storage.from('clipboard').remove(fileNames);
                if (deleteFilesError) throw deleteFilesError;
            }

            clipboardContent.innerHTML = '';
            showToast('Todo el contenido ha sido borrado.', 'error');
        } catch (error) {
            console.error('Error borrando todo:', error);
            showToast(`No se pudo borrar todo el contenido: ${error.message}`, 'error');
            await loadItems();
        }
    }

    function createAndAppendItem(itemData) {
        const item = document.createElement('div');
        item.className = 'clipboard-item';

        const isText = itemData.type === 'text';
        const contentHTML = isText ? `<p>${itemData.content}</p>` : `<a href="${itemData.publicUrl}" target="_blank" download>${itemData.name}</a>`;
        
        const copyButtonHTML = isText ? '<div class="dropdown-item copy-btn">Copiar</div>' : '';

        item.innerHTML = `
            <div class="item-content">
                ${contentHTML}
            </div>
            <button class="menu-button">&#8942;</button>
            <div class="dropdown-menu">
                ${copyButtonHTML}
                <div class="dropdown-item details-btn">Detalles</div>
                <div class="dropdown-item delete-btn">Eliminar</div>
            </div>
        `;

        clipboardContent.appendChild(item);

        const menuButton = item.querySelector('.menu-button');
        const dropdownMenu = item.querySelector('.dropdown-menu');
        const detailsButton = item.querySelector('.details-btn');
        const deleteButton = item.querySelector('.delete-btn');

        if (isText) {
            const copyButton = item.querySelector('.copy-btn');
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(itemData.content).then(() => {
                    showToast('¡Copiado al portapapeles!', 'success');
                }).catch(err => {
                    console.error('Error al copiar', err);
                    showToast('Error al copiar.', 'error');
                });
            });
        }

        menuButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const wasOpen = dropdownMenu.classList.contains('show');
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                if (m !== dropdownMenu) {
                    m.classList.remove('show');
                    m.closest('.clipboard-item').classList.remove('menu-open');
                }
            });
            if (!wasOpen) {
                dropdownMenu.classList.add('show');
                item.classList.add('menu-open');
            } else {
                dropdownMenu.classList.remove('show');
                item.classList.remove('menu-open');
            }
        });

        detailsButton.addEventListener('click', () => {
            const details = `Creado el: ${new Date(itemData.created_at).toLocaleString()}`;
            alert(details);
        });

        deleteButton.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que quieres eliminar este elemento?')) return;
            try {
                let error;
                if (isText) {
                    const { error: deleteError } = await supabase.from('items').delete().match({ id: itemData.id });
                    error = deleteError;
                } else {
                    const { error: removeError } = await supabase.storage.from('clipboard').remove([itemData.name]);
                    error = removeError;
                }

                if (error) {
                    throw error;
                } else {
                    item.remove();
                    showToast('Elemento eliminado.', 'error');
                }
            } catch (error) {
                console.error('Error eliminando el elemento:', error);
                showToast(`No se pudo eliminar el elemento: ${error.message}`, 'error');
            }
        });
    }

    // Initial Load
    loadItems();
    console.log("Portapapeles web inicializado y conectado a Supabase.");
});