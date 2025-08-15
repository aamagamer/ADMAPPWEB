// utils.js
function goBack() {
  window.history.back();
}

function logout() {
   
            // Limpiar localStorage
            localStorage.removeItem('idUsuario');
            
            // Redirigir al login y borrar el historial
            window.location.replace('index.html');  // `replace()` evita que se guarde en el historial
       
}

/**
 * Función para hacer el header fijo al hacer scroll
 * Debe ser llamada después de que el DOM esté completamente cargado
 */
function initStickyHeader() {
  const header = document.querySelector('header');
  
  if (!header) {
    console.warn('No se encontró el elemento header');
    return;
  }

  // Obtener la altura original del header
  const headerHeight = header.offsetHeight;
  
  // Crear un elemento placeholder para mantener el espacio del header
  const placeholder = document.createElement('div');
  placeholder.style.height = headerHeight + 'px';
  placeholder.style.display = 'none';
  
  // Insertar el placeholder después del header
  header.parentNode.insertBefore(placeholder, header.nextSibling);

  // Función que se ejecuta al hacer scroll
  function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 0) {
      // Cuando se hace scroll hacia abajo
      header.style.position = 'fixed';
      header.style.top = '0';
      header.style.left = '0';
      header.style.right = '0';
      header.style.zIndex = '1000';
      header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      
      // Mostrar el placeholder para mantener el espacio
      placeholder.style.display = 'block';
    } else {
      // Cuando se regresa al top
      header.style.position = 'static';
      header.style.boxShadow = 'none';
      
      // Ocultar el placeholder
      placeholder.style.display = 'none';
    }
  }

  // Agregar el event listener para el scroll
  window.addEventListener('scroll', handleScroll);
  
  // Verificar la posición inicial
  handleScroll();
}

/**
 * Función alternativa más simple que solo usa CSS
 * Esta opción es más eficiente pero el header siempre estará fijo
 */
function initSimpleStickyHeader() {
  const header = document.querySelector('header');
  
  if (!header) {
    console.warn('No se encontró el elemento header');
    return;
  }

  // Aplicar estilos CSS directamente
  header.style.position = 'sticky';
  header.style.top = '0';
  header.style.zIndex = '1000';
  header.style.backgroundColor = '#ffffff'; // Ajusta según tu diseño
  header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
}


