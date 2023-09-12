# Project 15 Mapty Additional Features !!!!!!!!

## Description

Added additional features to Mapty by Jonas Schmedtmann. This application allows users to be able to keep track of their running and cycling workouts. By using a local map, users may click and place points for where they did their workout. Users are also able to log their distance, durations, and cadence/elevation gain depending on whether they're running or cycling respectively. These workouts will be saved to a local API, so the user may revisit their saved workouts at any time. The user is also able to edit each individual workout, delete each individual workout, and delete all saved workouts.

## Scenarios
With respect to Mapty functionality, users are able to
- Log running and cycling workouts that are saved by a marker on the map
- Enter Distance, Duration, and Cadence for Running Workouts
- Enter Distance, Duration, and Elevation Gain for Cycling Workouts
- Able to delete individual workouts, as well as all workouts at once
- Able to edit individual workouts to change all fields (Type, Distance, Duration, and Cadence/Elevation Gain)
- Workouts will save to browser, even when reloaded

## References

Leaflet: Map Plugin
- https://leafletjs.com/

Font Awesome: Edit & Delete Icon
- https://fontawesome.com/

## Requirements
- [ ] Create delete all button in html
- [ ] Create edit & delete button in _renderWorkout()
- [ ] Add event listeners for delete all in app constructor
- [ ] Add event listeners for edit & delete in _renderWorkout()
- [ ] Create function in app constructor to delete all workouts
- [ ] Create function in app constructor to delete single workout
- [ ] Create function in app constructor to edit workouts
- [ ] Create function in app constructor to remove markers
- [ ] Create functionality to differentiate between edited and new workout
- [ ] Rebuild running & cycling objects to preserve the prototype chain
