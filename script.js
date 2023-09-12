'use strict';

////////////////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnEdit = document.querySelector('.btnEdit');
const btnDelete = document.querySelector('.btnDelete');
const btnDeleteAll = document.querySelector('.btnDeleteAll');

////////////////////////////////////////////////
// WORKOUT CONSTRUCTOR
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lon]
    this.distance = distance; // in KM
    this.duration = duration; // in MIN
    this.marker = null;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  setMarker(marker) {
    this.marker = marker;
  }
}

////////////////////////////////////////////////
// RUNNING CHILD CONSTRUCTOR
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence, ID = null) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();

    if (ID) this.id = ID;
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

////////////////////////////////////////////////
// CYCLING CHILD CONSTRUCTOR
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain, ID = null) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();

    if (ID) this.id = ID;
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

////////////////////////////////////////////////
// APP CONSTRUCTOR
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  // For edit functionality (holds currenlty selected active workout)
  #currWorkout;
  // For rebuilding functionality
  #myDiv;

  constructor() {
    // For submitting functionality
    this.submitNewWorkout = this._newWorkout.bind(this);
    // Get user position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this.submitNewWorkout);
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    btnDeleteAll.addEventListener('click', this._deleteAllWorkouts);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Couldn't get your position");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.setAttribute('data-new', 'true');
    form.classList.remove('hidden');
    inputDistance.focus();

    // Clean inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  _hideForm() {
    // Clean inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    // Hide Class
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // Check if new workout or edit workout
    if (form.dataset.new === 'false') {
      this._editFormSubmit();
      return;
    }

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type == 'running') {
      // Check if data is valid
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs should be positive');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type == 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs should be positive');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + Clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords);
    marker
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? 'Run: ' : 'Cycle:'} ${
          workout.description
        }`
      )
      .openPopup();

    workout.setMarker(marker);
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? ' 🏃 ' : ' 🚴‍♂️ '
          }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
     `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
        <button class = "btnEdit"> <i class="fa-solid fa-pen-to-square"></i> </button>
        <button class = "btnDelete">   <i class="fa-solid fa-trash"></i> </button>
    </li>
        `;
    }

    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
        <button class = "btnEdit"> <i class="fa-solid fa-pen-to-square"></i> </button>
        <button class = "btnDelete">   <i class="fa-solid fa-trash"></i> </button>
    </li>
          `;
    }

    // Generated workout item from workout object creates HTML element '#myDiv' and inserts it into DOM
    this.#myDiv = document.createElement('div');
    this.#myDiv.innerHTML = html;
    form.insertAdjacentElement('afterend', this.#myDiv);

    // Edit & Delete event listeners
    this.#myDiv
      .querySelector('.btnEdit')
      .addEventListener('click', this._editWorkout.bind(this));
    this.#myDiv
      .querySelector('.btnDelete')
      .addEventListener('click', this._deleteWorkout.bind(this));

    return this.#myDiv;
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    if (!workout) return;

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  _setLocalStorage() {
    localStorage.setItem(
      'workouts',
      JSON.stringify(
        this.#workouts.map(item => {
          if (item.type.toLowerCase() == 'running') {
            const { id, coords, distance, duration, type, cadence } = item;
            return {
              id,
              coords,
              distance,
              duration,
              type,
              cadence,
            };
          }
          const { id, coords, distance, duration, type, elevationGain } = item;
          return {
            id,
            coords,
            distance,
            duration,
            type,
            elevationGain,
          };
        })
      )
    );
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    data.forEach(work => {
      const workout =
        work.type.toLowerCase() == 'running'
          ? new Running(
              work.coords,
              work.distance,
              work.duration,
              work.cadence,
              work.id
            )
          : new Cycling(
              work.coords,
              work.distance,
              work.duration,
              work.elevationGain,
              work.id
            );
      this.#workouts.push(workout);
    });
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  // Submission function
  _editFormSubmit() {
    // Assign input values to currWorkout
    this.#currWorkout.type = inputType.value;
    this.#currWorkout.distance = +inputDistance.value;
    this.#currWorkout.duration = +inputDuration.value;

    // If running, set running value
    if (this.#currWorkout.type === 'running') {
      this.#currWorkout.cadence = +inputCadence.value;
      this.#currWorkout.pace = inputDuration.value / inputDistance.value;
    }
    // If cycling, set cycling value
    else if (this.#currWorkout.type === 'cycling') {
      this.#currWorkout.elevationGain = +inputElevation.value;
      this.#currWorkout.speed =
        inputDistance.value / (inputDuration.value / 60);
    }

    form.classList.add('hidden');
    this._renderWorkout(this.#currWorkout);
    this._setLocalStorage();
  }

  _editWorkout(e) {
    e.preventDefault();

    // Change attribute
    form.setAttribute('data-new', 'false');

    // Finds current workout by matching IDs
    const li = e.target.closest('li');
    const dataID = li.getAttribute('data-id');
    this.#currWorkout = this.#workouts.find(workout => workout.id === dataID);
    form.setAttribute('data-itemId', dataID);

    // Hide the original workout item and show the edit form
    li.classList.add('hidden');
    form.classList.remove('hidden');
    inputDistance.focus();

    // Populate the edit form with the original workout values
    inputDistance.value = this.#currWorkout.distance;
    inputDuration.value = this.#currWorkout.duration;
    inputType.value = this.#currWorkout.type;

    // Set Cadence or Elevation value; Display proper input form
    if (this.#currWorkout.type === 'running') {
      inputCadence.value = this.#currWorkout.cadence;
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
    }
    if (this.#currWorkout.type === 'cycling') {
      inputElevation.value = this.#currWorkout.elevationGain;
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
    }
  }

  _removeMarker(workout) {
    workout.marker.removeFrom(this.#map);
  }

  _deleteWorkout(e) {
    e.preventDefault();

    const li = e.target.closest('li');

    // Loop through workouts array
    this.#workouts.forEach((workout, i) => {
      // If current workout in #workouts array has same id as <li> element, remove marker associated, splice out the workout from the array at said index, remove <li> element, update local storage
      if (workout.id === li.dataset.id) {
        this._removeMarker(workout);
        this.#workouts.splice(i, 1);
        li.remove();
        this._setLocalStorage();
        console.log(workout, i);
      }
      return;
    });
  }

  _deleteAllWorkouts() {
    // Delete all workouts
    app.reset();
  }
}
const app = new App();
