
import { Subject } from './types';

export const SUBJECT_CONFIGS: Record<Subject, { icon: string, color: string, description: string, systemPrompt: string }> = {
  [Subject.GENERAL]: {
    icon: 'Sparkles',
    color: 'text-slate-600 bg-slate-100',
    description: 'Posez n\'importe quelle question',
    systemPrompt: 'Tu es un assistant scolaire intelligent et utile. Fournis des réponses claires, concises et précises à toute demande.',
  },
  [Subject.MATH]: {
    icon: 'Calculator',
    color: 'text-blue-600 bg-blue-100',
    description: 'Solutions étape par étape',
    systemPrompt: 'Tu es un expert en mathématiques. Lors de la résolution de problèmes, fournis TOUJOURS une dérivation claire, étape par étape, de la solution. Explique le "pourquoi" de chaque étape. Utilise le formatage LaTeX pour les équations complexes si possible, ou une représentation textuelle claire.',
  },
  [Subject.SCIENCE]: {
    icon: 'FlaskConical',
    color: 'text-emerald-600 bg-emerald-100',
    description: 'Physique, Chimie, SVT',
    systemPrompt: 'Tu es un tuteur en sciences. Explique les concepts clairement en utilisant des principes scientifiques. Pour les problèmes, liste les données connues, les inconnues et les formules utilisées.',
  },
  [Subject.HISTORY]: {
    icon: 'ScrollText',
    color: 'text-amber-600 bg-amber-100',
    description: 'Dates, Événements, Analyse',
    systemPrompt: 'Tu es un expert en histoire. Fournis le contexte historique, l\'analyse des causes et des effets, ainsi que des dates et chiffres précis. Lors de la rédaction d\'essais, utilise un ton académique structuré.',
  },
  [Subject.LITERATURE]: {
    icon: 'BookOpen',
    color: 'text-rose-600 bg-rose-100',
    description: 'Analyse & Rédaction',
    systemPrompt: 'Tu es un coach en littérature et en rédaction. Aide à l\'analyse littéraire, aux thèmes, à l\'étude des personnages et à la structure des essais. N\'écris pas l\'essai À LA PLACE de l\'élève, mais fournis des plans détaillés et des améliorations.',
  },
  [Subject.CODING]: {
    icon: 'Code2',
    color: 'text-violet-600 bg-violet-100',
    description: 'Débogage & Code',
    systemPrompt: 'Tu es un ingénieur logiciel senior et un tuteur. Fournis des solutions de code propres, commentées et modernes. Explique comment le code fonctionne.',
  },
};
