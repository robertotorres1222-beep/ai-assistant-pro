import React, { useState } from 'react'
import { 
  Check, 
  X, 
  Zap, 
  Brain, 
  Shield, 
  Star,
  Rocket,
  Diamond
} from 'lucide-react'

interface PricingPlan {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  limitations: string[]
  badge?: string
  badgeColor?: string
  popular?: boolean
  icon: React.ComponentType<any>
  gradient: string
  models: string[]
  messagesPerMonth: number | 'unlimited'
}

interface PricingPlansProps {
  onSelectPlan: (planId: string) => void
  currentPlan?: string
}

export default function PricingPlans({ onSelectPlan, currentPlan = 'free' }: PricingPlansProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for trying out AI Assistant Pro',
      icon: Star,
      gradient: 'from-gray-500 to-gray-600',
      messagesPerMonth: 20,
      models: ['gpt-3.5-turbo', 'claude-3-haiku', 'gemini-1.5-flash'],
      features: [
        '20 messages per month',
        'Basic AI models',
        'Standard response time',
        'Web interface access',
        'Basic security features'
      ],
      limitations: [
        'Limited to basic models',
        'No priority support',
        'Standard rate limits',
        'No advanced features'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingPeriod === 'monthly' ? 20 : 200,
      period: billingPeriod === 'monthly' ? 'month' : 'year',
      description: 'For professionals and power users',
      icon: Rocket,
      gradient: 'from-blue-500 to-purple-600',
      popular: true,
      badge: 'Most Popular',
      badgeColor: 'bg-blue-500',
      messagesPerMonth: 1000,
      models: ['gpt-4o', 'gpt-4-turbo', 'claude-3-5-sonnet', 'claude-3-opus', 'gemini-1.5-pro'],
      features: [
        '1,000 messages per month',
        'Access to GPT-4o, Claude 3.5 Sonnet',
        'Priority response time',
        'Advanced reasoning models',
        'Code execution & analysis',
        'Image generation & analysis',
        'File processing (PDF, DOC, etc)',
        'Priority customer support',
        'Advanced security features'
      ],
      limitations: [
        'Monthly message limits',
        'Standard API rate limits'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: billingPeriod === 'monthly' ? 100 : 1000,
      period: billingPeriod === 'monthly' ? 'month' : 'year',
      description: 'For teams and organizations',
      icon: Diamond,
      gradient: 'from-purple-500 to-pink-600',
      badge: 'Best Value',
      badgeColor: 'bg-purple-500',
      messagesPerMonth: 'unlimited',
      models: ['All Models', 'o1-preview', 'o1-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash'],
      features: [
        'Unlimited messages',
        'All AI models including o1-preview',
        'Fastest response times',
        'Advanced reasoning & tools',
        'Custom model fine-tuning',
        'API access & integrations',
        'Team collaboration features',
        'Advanced analytics',
        'White-label options',
        'Dedicated account manager',
        'Enterprise-grade security',
        'Custom deployment options'
      ],
      limitations: []
    }
  ]

  const getModelBadge = (model: string) => {
    if (model.includes('o1') || model.includes('4o')) return { text: 'NEW', color: 'bg-green-500' }
    if (model.includes('3.5') || model.includes('2.0')) return { text: 'LATEST', color: 'bg-orange-500' }
    if (model.includes('ultra') || model.includes('opus')) return { text: 'PREMIUM', color: 'bg-purple-500' }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your <span className="text-gradient">AI Power</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Unlock the full potential of cutting-edge AI models
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingPeriod === 'yearly' ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingPeriod === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                Save 17%
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = currentPlan === plan.id
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white/5 backdrop-blur-xl border rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:bg-white/8 ${
                  plan.popular 
                    ? 'border-blue-500/50 ring-2 ring-blue-500/20' 
                    : 'border-white/10'
                } ${
                  isCurrentPlan ? 'ring-2 ring-green-500/50' : ''
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 ${plan.badgeColor} text-white text-xs font-semibold rounded-full`}>
                    {plan.badge}
                  </div>
                )}
                
                {/* Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${plan.gradient} rounded-2xl flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                  
                  <div className="text-sm text-gray-400 mb-4">
                    {typeof plan.messagesPerMonth === 'number' 
                      ? `${plan.messagesPerMonth.toLocaleString()} messages/month`
                      : 'Unlimited messages'
                    }
                  </div>
                </div>

                {/* Models */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Available Models:</h4>
                  <div className="space-y-2">
                    {plan.models.slice(0, 3).map((model, index) => {
                      const badge = getModelBadge(model)
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">{model}</span>
                          {badge && (
                            <span className={`px-2 py-0.5 ${badge.color} text-white text-xs rounded-full`}>
                              {badge.text}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {plan.models.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{plan.models.length - 3} more models
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">Limitations:</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-400">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                    isCurrentPlan
                      ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : `Choose ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Features Comparison */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Why Choose AI Assistant Pro?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Latest AI Models</h3>
              <p className="text-gray-400 text-sm">
                Access to GPT-4o, Claude 3.5 Sonnet, o1-preview, and Gemini 2.0 - the most advanced AI models available
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">
                Optimized infrastructure for the fastest AI response times in the industry
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Enterprise Security</h3>
              <p className="text-gray-400 text-sm">
                Bank-level encryption, SOC 2 compliance, and enterprise-grade security features
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-400 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">What happens if I exceed my limits?</h3>
              <p className="text-gray-400 text-sm">
                We'll notify you when you're approaching your limits. You can upgrade anytime to continue using the service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
