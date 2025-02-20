//-----------------------------------------------------------------------
// <copyright file="CompareDoubleValidator.cs" company="VKeCRM">
//     Company copyright tag.
// </copyright>
//-----------------------------------------------------------------------
using System;

namespace VKeCRM.Common.Validation
{
	/// <summary>
    /// Compares two decimal values
	/// </summary>
	public class CompareDoubleValidator : CompareValidatorBase
    {
        #region Constructors

        /// <summary>
        /// Initializes a new instance of the CompareDoubleValidator class
        /// </summary>
        public CompareDoubleValidator()
		{
		}

        /// <summary>
        /// Initializes a new instance of the CompareDoubleValidator class
        /// </summary>
        /// <param name="compareOperator">Operator used for comparison</param>
        /// <param name="valueToCompare">The first value to compare</param>
        /// <param name="compareToValue">The second value to compare</param>
		public CompareDoubleValidator(ValidationCompareOperator compareOperator, object valueToCompare, object compareToValue)
		{
			_compareOperator = compareOperator;
			_valueToCompare = Convert.ToDouble(valueToCompare);
			_compareToValue = Convert.ToDouble(compareToValue);
		}

        /// <summary>
        /// Initializes a new instance of the CompareDoubleValidator class
        /// </summary>
        /// <param name="compareOperator">Operator used for comparison</param>
        /// <param name="valueToCompare">The first value to compare</param>
        /// <param name="compareToValue">The second value to compare</param>
		public CompareDoubleValidator(ValidationCompareOperator compareOperator, double valueToCompare, double compareToValue)
			: base(compareOperator, valueToCompare, compareToValue)
		{
        }

        #endregion

        #region Properties

        /// <summary>
        /// Gets or sets the value to compare
        /// </summary>
        public new double ValueToCompare
		{
			get 
            { 
                return (double)base.ValueToCompare; 
            }

			set 
            { 
                base.ValueToCompare = value; 
            }
		}
        
        /// <summary>
        /// Gets or sets the value to compare to
        /// </summary>
		public new double CompareToValue
		{
			get 
            { 
                return (double)base.CompareToValue; 
            }

			set 
            { 
                base.CompareToValue = value; 
            }
        }

        #endregion

        #region Methods

        /// <summary>
        /// To set the value to compare to
        /// </summary>
        /// <returns>Returns the value to compare to</returns>
        protected override int CompareTo()
		{
			double valueToCompare = (double)_valueToCompare;
			double compareToValue = (double)_compareToValue;

			return valueToCompare.CompareTo(compareToValue);
		}

        /// <summary>
        /// Pre-validate the result
        /// </summary>
        /// <returns>Returns a boolean value to indicate whether the result is pre-validated</returns>
		protected override bool PreValidate()
		{
			bool result = true;

			return result;
        }

        #endregion
    }
}