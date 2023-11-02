import { useNavigation } from '@react-navigation/core';
import React, { useEffect, useState, useRef } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase';
import { router } from 'expo-router';

import MapView, { Marker, Polyline } from 'react-native-maps';
import { requestForegroundPermissionsAsync, getCurrentPositionAsync, watchPositionAsync, stopLocationUpdatesAsync, LocationAccuracy } from 'expo-location';

import MapViewDirections from 'react-native-maps-directions';

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState(null);
  const [trackingRoute, setTrackingRoute] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [startLocation, setStartLocation] = useState(null); // Adicione o estado para controlar o local de início
  let watchId = null;

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const navigation = useNavigation();

  const [userCoordinates, setUserCoordinates] = useState([]);

  // Começar cronômetro
  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1000); // Incrementa o tempo em 1 segundo
      }, 1000);
    }
  };

  // Parar cronômetro
  const handleStop = () => {
    if (isRunning) {
      setIsRunning(false);
      clearInterval(intervalRef.current);
      setStartLocation(null);
    }
  };

  // Resetar cronômetro
  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    clearInterval(intervalRef.current);
    setDistanceTraveled(0);
    setRouteCoordinates([]);
    setStartLocation(null); // Zere o local de início
    setUserCoordinates([]); // Limpar o rastro
  };


  // Formatar tempo
  const formatTime = (milliseconds) => {
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));

    const format = (val) => (val < 10 ? `0${val}` : val);

    return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
  };

  // Permissão de localização
  async function requestLocationPermissions() {
    const { granted } = await requestForegroundPermissionsAsync();

    if (granted) {
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
      console.log("Localização atual", currentPosition);
    }
  }



  useEffect(() => {
    requestLocationPermissions();
    

    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        router.replace('/');
      }
    });
  }, []);

  // Pegar posição
  useEffect(() => {
    watchPositionAsync({
      accuracy: LocationAccuracy.Highest,
      timeInterval: 1000,
      distanceInterval: 1
    }, (response) => {
      console.log("Nova localização!");
      setLocation(response);
    });
  }, []);

  // Função dos botões
  const toggleTracking = () => {
    if (!trackingRoute) {
      handleStart();
      watchLocation();
      setStartLocation(location); // Defina o local de início
    } else {
      handleStop();
      stopLocationTracking();
      // Calcule a distância entre a startLocation e a última localização na rota
      if (startLocation && routeCoordinates.length > 0) {
        const lastCoords = routeCoordinates[routeCoordinates.length - 1];
        const newDistance = haversine(startLocation.coords, lastCoords) || 0;
        setDistanceTraveled(distanceTraveled + newDistance);
      }
    }
    setTrackingRoute(!trackingRoute);
  };

  const haversine = (coords1, coords2) => {
    const rad = x => (x * Math.PI) / 180;
    const R = 6371; // Raio da Terra em quilômetros
    const dLat = rad(coords2.latitude - coords1.latitude);
    const dLong = rad(coords2.longitude - coords1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(coords1.latitude)) *
      Math.cos(rad(coords2.latitude)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distância em metros
  };

  const watchLocation = async () => {
    watchId = await watchPositionAsync(
      {
        accuracy: LocationAccuracy.Highest,
        timeInterval: 1000,
        distanceInterval: 1
      },
      newLocation => {
        const { latitude, longitude } = newLocation.coords;
        setLocation(newLocation);
  
        // Atualize o estado userCoordinates com as novas coordenadas
        setUserCoordinates(prevCoordinates => [...prevCoordinates, newLocation.coords]);
  
        if (location && routeCoordinates.length > 1) {
          const prevCoords = routeCoordinates[routeCoordinates.length - 1];
          const newDistance = haversine(prevCoords, newLocation.coords) || 0;
          setDistanceTraveled(distanceTraveled + newDistance);
        }
  
        setRouteCoordinates([...routeCoordinates, newLocation.coords]);
      }
    );
  };
  

  const stopLocationTracking = () => {
    if (watchId !== null) {
      stopLocationUpdatesAsync(watchId);
    }
  };

  // Deslogar
  const logout = () => {
    signOut(auth)
      .then(() => {
        // Sign-out successful.
        console.log('Usuário deslogado');
        router.replace('/');
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
    >
      {location &&
      <MapView
        style={styles.map}
        initialRegion={{
          latitude:location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation={true}
      >
        {/*
        {trackingRoute && routeCoordinates.length > 1 && (
          <MapViewDirections
            origin={routeCoordinates[0]}
            waypoints={routeCoordinates.slice(1, -1)}
            destination={routeCoordinates[routeCoordinates.length - 1]}
            apikey={'AIzaSyCxFJ8LxyZb3wLNfqU6cfIsVlY1AIhkIvM'}
            strokeWidth={3}
            strokeColor="blue" // Cor da rota em tempo real
          />
        )}
        */}
        {startLocation && ( // Exibe o marcador no local de início
          <Marker
            coordinate={{
              latitude: startLocation.coords.latitude,
              longitude: startLocation.coords.longitude,
            }}
          
          />
        )}
         {userCoordinates.length > 1 && isRunning == true &&(
    <Polyline
      coordinates={userCoordinates}
      strokeColor="red" // Cor da trilha
      strokeWidth={3}
    />
  )}
      </MapView>
      }

      <View style={styles.dataContainer}>
        <Text style={styles.timerText}>Tempo: {formatTime(elapsedTime)}</Text>
        <Text style={styles.timerText}>Distância: {distanceTraveled.toFixed(2)}</Text>
      </View>

      <View style={styles.buttonContainer}>
            <TouchableOpacity
        onPress={toggleTracking}
        style={[
          styles.button,
          styles.buttonOutline,
          trackingRoute ? styles.stopButton : styles.startButton
        ]}
      >
        <Text style={styles.buttonOutlineText}>
          {trackingRoute ? 'Parar Rota' : 'Iniciar Rota'}
        </Text>
      </TouchableOpacity>

        <TouchableOpacity onPress={handleReset} style={styles.button}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={logout}
        style={[styles.button, styles.out]}
      >
        <Text style={styles.buttonOutlineText}>Sair</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  inputContainer: {},
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  buttonOutline: {
    // Estilos padrão do botão
    backgroundColor: 'white',
    borderColor: '#0782F9',
    borderWidth: 2,
  },
  startButton: {
    // Estilos para o botão "Iniciar Rota"
    backgroundColor: 'green', // Cor verde
    borderColor: 'green', // Borda verde
  },
  stopButton: {
    // Estilos para o botão "Parar Rota"
    backgroundColor: 'red', // Cor vermelha
    borderColor: 'red', // Borda vermelha
  },

  dataContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'orange',
    width: '40%', 
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 10, 
  },
  buttonOutline: {
    backgroundColor: 'blue',
    marginTop: 5,
    borderColor: '#0782F9',
    borderWidth: 2,
  },
  out:{
    backgroundColor: 'blue',
    marginTop: 5,
    width: '20%',
    borderWidth: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutlineText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  log: {
    color: 'blue',
  },
  registrado: {
    marginTop: '10px',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
});
