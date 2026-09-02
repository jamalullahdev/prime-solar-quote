import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import BillCalculatorScreen from '../screens/BillCalculatorScreen';
import TemplatePickerScreen from '../screens/TemplatePickerScreen';
import TemplateBuilderScreen from '../screens/TemplateBuilderScreen';
import QuotationEditorScreen from '../screens/QuotationEditorScreen';
import PreviewScreen from '../screens/PreviewScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="BillCalculator" component={BillCalculatorScreen} />
        <Stack.Screen name="TemplatePicker" component={TemplatePickerScreen} />
        <Stack.Screen name="TemplateBuilder" component={TemplateBuilderScreen} />
        <Stack.Screen name="QuotationEditor" component={QuotationEditorScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
