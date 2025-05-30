import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, TouchableWithoutFeedback } from 'react-native';

const CustomPopup = ({
  visible,
  title,
  message,
  onClose,
  confirmText = "OK",
  onConfirm,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.popup, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {message ? <Text style={styles.message}>{message}</Text> : null}
              {children}
              {!children && (
                <TouchableOpacity style={styles.button} onPress={onConfirm || onClose}>
                  <Text style={styles.buttonText}>{confirmText}</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: 0,
  },
  message: {
    fontSize: 15,
    color: '#444',
    marginBottom: 14,
    textAlign: 'center',
    backgroundColor: 'transparent',
    padding: 0,
  },
  button: {
    backgroundColor: '#418EDA',
    borderRadius: 100,
    paddingVertical: 9,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#418EDA',
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default CustomPopup;