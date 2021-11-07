'use strict';
//    form__edit
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const formE = document.querySelector('.form__edit');
const inputTypeE = document.querySelector('.form__edit__input--type');
const inputDistanceE = document.querySelector('.form__edit__input--distance');
const inputDurationE = document.querySelector('.form__edit__input--duration');
const inputCadenceE = document.querySelector('.form__edit__input--cadence');
const inputElevationE = document.querySelector('.form__edit__input--elevation');
const dltAll = document.querySelector('.delete__all');

/// ! WORKOUT CLASS
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; //    [lat, lng]
    this.distance = distance;
    this.duration = duration;
  }
  _setDescr() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    return this.description;
  }
}

/// ! Class Child Running
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescr();
  }
  calcPace() {
    //  min/kg
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

/// ! Class Child Running
class Cyclying extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescr();
  }
  calcSpeed() {
    //   km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/// * ///////////////  /// * ////////////  /// * ////////////  /// *

// ! APPLICATION ARCHITECTURE

class App {
  #map;
  #mapEvent;
  #workouts = [];
  workoutE;
  workoutInd;
  constructor() {
    this._getPosition();
    this._getLocalStorg();
    form.addEventListener('submit', this._newWorkout.bind(this));
    formE.addEventListener('submit', this._formWorkoutE.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    inputTypeE.addEventListener('change', this._toggleElevationFieldE);

    containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
    containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._editWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._deleteAll.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        this._locationNotWork
      );
    }
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coord = [latitude, longitude];

    this.#map = L.map('map').setView(coord, 16);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    /// => Handling Clicks on the map !
    this.#map.on('click', this._showform.bind(this));
    this.#workouts.forEach(work => this._displayMarker(work));
  }
  _locationNotWork() {
    alert(`can\`t acces your Location !`);
  }
  _showform(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove(`hidden`);
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    inputDistance.blur();
    form.classList.add(`hidden`);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    /// => Helping Functions
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    /// =>  Get Data from inputs
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    /// =>  Check the Data and
    /// =>  if Workout Running Create new running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs must be Positive Numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    /// =>  if Workout Cyclying Create new cycling
    if (type === 'cycling') {
      const elevGain = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevGain) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs must be Positive Numbers');

      workout = new Cyclying([lat, lng], distance, duration, elevGain);
    }
    /// =>  Add the Workout to the Workouts Array
    this.#workouts.push(workout);
    if (this.#workouts.length === 0) {
      dltAll.style.display = 'none';
    } else {
      dltAll.style.display = 'inherit';
    }
    /// =>  Render Workout on the Map as a Marker
    this._displayMarker(workout);

    /// =>  Render Workout on the Form
    this._displayWorkout(workout);
    /// =>  Clear Input Fields and Hide Form after every Workout
    this._hideForm();

    this._setLocalStorg();
  }

  /// => Display Marker !
  _displayMarker(workout) {
    L.marker(workout.coords, { draggable: true })
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
        `${workout.type === `running` ? `🏃‍♂️` : `🚴‍♀️`}  ${workout.description}`
      )
      .openPopup();
  }
  _displayWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === `running` ? `🏃‍♂️` : `🚴‍♀️`
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;
    if (workout.type === `running`) {
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
          <div class=" btns__row">
          <button class="btn__workout btns__run edit">Edit</button>
          <button class="btn__workout btns__run delete" >Delete</button>
          </div>
        </li>
      `;
    }
    if (workout.type === `cycling`) {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🚵🏻‍♀️</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">m</span>
        </div>
        <div class=" btns__row">
            <button class="btn__workout btns__cyc edit">Edit</button>
            <button class="btn__workout btns__cyc delete" >Delete</button>
          </div>
      </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToMarker(e) {
    const workoutClicked = e.target.closest(`.workout`);
    if (!workoutClicked) return;

    const workoutObj = this.#workouts.find(
      work => work.id === workoutClicked.dataset.id
    );
    this.#map.setView(workoutObj.coords, 16, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  _setLocalStorg() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorg() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => this._displayWorkout(work));
  }
  _deleteWorkout(e) {
    if (!e.target.classList.contains('delete')) return;
    const workoutDel = e.target.closest('.workout');
    const workoutObj = this.#workouts.find(
      work => work.id === workoutDel.dataset.id
    );
    this.#workouts.splice(this.#workouts.indexOf(workoutObj), 1);
    this._renderApp();
  }

  _editWorkout(e) {
    if (!e.target.classList.contains('edit')) return;

    const workoutEdit = e.target.closest('.workout');
    this.workoutE = this.#workouts.find(
      work => work.id === workoutEdit.dataset.id
    );
    this.workoutInd = this.#workouts.findIndex(
      work => work.id === workoutEdit.dataset.id
    );

    formE.classList.remove(`hidden`);
    inputDistanceE.focus();
  }
  _formWorkoutE(e) {
    e.preventDefault();

    ///////////

    /// => Helping Functions
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    /// =>  Get Data from inputs
    const type = inputTypeE.value;
    const distance = +inputDistanceE.value;
    const duration = +inputDurationE.value;

    const [lat, lng] = this.workoutE.coords;

    let workout;

    ///////////////
    /// =>  Check the Data and
    /// =>  if Workout Running Create new running
    if (type === 'running') {
      const cadence = +inputCadenceE.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs must be Positive Numbers');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    /// =>  if Workout Cyclying Create new cycling
    if (type === 'cycling') {
      const elevGain = +inputElevationE.value;
      if (
        !validInputs(distance, duration, elevGain) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs must be Positive Numbers');

      workout = new Cyclying([lat, lng], distance, duration, elevGain);
    }

    ///////////////

    /// =>  Add the Workout to the Workouts Array
    this.#workouts.splice(this.workoutInd, 1, workout);

    /// =>  Render APP

    this._renderApp();
  }
  _renderApp() {
    const lis = document.querySelectorAll('.workout');
    if (this.#workouts.length === 0) {
      dltAll.style.display = 'none';
    } else {
      dltAll.style.display = 'inherit';
    }
    this.workoutE = '';
    this.workoutInd = '';
    this._setLocalStorg();
    this._getLocalStorg();
    this.#map.off();
    this.#map.remove();
    this._hideFormE();
    lis.forEach(li => li.remove());
    this._getPosition();
  }
  _toggleElevationFieldE() {
    inputElevationE
      .closest('.form__edit__row')
      .classList.toggle('form__edit__row--hidden');
    inputCadenceE
      .closest('.form__edit__row')
      .classList.toggle('form__edit__row--hidden');
  }
  _hideFormE() {
    inputDistanceE.value =
      inputCadenceE.value =
      inputDurationE.value =
      inputElevationE.value =
        '';
    inputDistanceE.blur();
    formE.classList.add(`hidden`);
  }
  _deleteAll(e) {
    if (!e.target.classList.contains('delete__all')) return;
    this.#workouts = [];
    this._renderApp();
  }
  /// => Reset the Storage !
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
