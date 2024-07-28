const rows = document.getElementsByClassName('row');

function updateRow(row, name, category) {
    if (name.value != '' && category.value != 'NOT CHOSEN') {
        row.classList.remove('unconfigured-row');
    } else {
        row.classList.add('unconfigured-row');
    }
}

for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.querySelector('.input-name');
    const category = row.querySelector('.select-category');

    name.addEventListener('blur', () => updateRow(row, name, category));
    category.addEventListener('change', () => updateRow(row, name, category));
}
