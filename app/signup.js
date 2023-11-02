import { useNavigation } from '@react-navigation/core'
import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase';
import { router, Link } from 'expo-router';

const signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const navigation = useNavigation()

  

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        const user = userCredential.user;
        console.log('Conta criada!', user);
        router.replace('/');
      })
      .catch(error => {
        console.log(error);
        alert("Erro ao criar conta: " + error.message);
        // Adicione aqui a lógica para lidar com erros, por exemplo: alert("Erro ao criar conta: " + error.message);
      })
  }



  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
    >
      <Text style={styles.principal}>Crie uma Conta</Text>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={text => setEmail(text)}
          style={styles.input}
        />
        <TextInput
          placeholder="Senha"
          value={password}
          onChangeText={text => setPassword(text)}
          style={styles.input}
          secureTextEntry
        />
      </View>

      <View style={styles.buttonContainer}>
        
        <TouchableOpacity
          onPress={handleSignUp}
          style={[styles.button, styles.buttonOutline]}
        >
          <Text style={styles.buttonOutlineText}>Registrar</Text>
        </TouchableOpacity>
        <Text style={[ styles.registrado]}>
            Já está registrado? <Link href="/" style={[ styles.log]}>
        
        Login
        </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

export default signup

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  inputContainer: {
    width: '80%'
  },
  input: {
    backgroundColor: '#e6e3e3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  buttonContainer: {
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  button: {
    backgroundColor: '#0782F9',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'white',
    marginTop: 5,
    borderColor: '#0782F9',
    borderWidth: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonOutlineText: {
    color: '#0782F9',
    fontWeight: '700',
    fontSize: 16,
  },
  log: {
    color: 'blue',
  },
  registrado: {
    marginTop: 15,
  },
  principal: {
    color: '#0782F9',
    fontSize: 40, // Tamanho da fonte da logo
    fontWeight: 'bold', // Peso da fonte
    marginBottom: 20,
    fontFamily: 'serif'
  },
})
