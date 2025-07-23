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