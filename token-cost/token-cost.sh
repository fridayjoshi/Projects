#!/usr/bin/env bash
# token-cost - Calculate token usage and costs from OpenClaw session logs

set -euo pipefail

SESSIONS_DIR="${1:-$HOME/.openclaw/agents/main/sessions}"

# Pricing per 1M tokens (input/output) - approximate
declare -A MODEL_COSTS=(
    ["anthropic/claude-sonnet-4-5"]="3.00/15.00"
    ["anthropic/claude-opus-4"]="15.00/75.00"
    ["anthropic/claude-haiku-3-5"]="0.80/4.00"
    ["openai/gpt-4"]="30.00/60.00"
    ["openai/gpt-3.5-turbo"]="0.50/1.50"
)

echo "💰 Token Cost Analysis"
echo "Scanning: $SESSIONS_DIR"
echo ""

total_input_tokens=0
total_output_tokens=0
total_cost=0

declare -A model_input
declare -A model_output
declare -A model_cost

# Process each JSONL session file
while IFS= read -r session_file; do
    while IFS= read -r line; do
        # Extract model, input tokens, output tokens from each turn
        model=$(echo "$line" | jq -r '.model // empty' 2>/dev/null)
        input=$(echo "$line" | jq -r '.usage.input_tokens // 0' 2>/dev/null)
        output=$(echo "$line" | jq -r '.usage.output_tokens // 0' 2>/dev/null)
        
        if [ -n "$model" ] && [ "$input" != "0" ]; then
            model_input["$model"]=$((${model_input["$model"]:-0} + input))
            model_output["$model"]=$((${model_output["$model"]:-0} + output))
            
            total_input_tokens=$((total_input_tokens + input))
            total_output_tokens=$((total_output_tokens + output))
            
            # Calculate cost
            if [ -n "${MODEL_COSTS[$model]:-}" ]; then
                IFS='/' read -r in_price out_price <<< "${MODEL_COSTS[$model]}"
                in_cost=$(echo "scale=4; $input * $in_price / 1000000" | bc)
                out_cost=$(echo "scale=4; $output * $out_price / 1000000" | bc)
                turn_cost=$(echo "scale=4; $in_cost + $out_cost" | bc)
                model_cost["$model"]=$(echo "scale=4; ${model_cost[$model]:-0} + $turn_cost" | bc)
                total_cost=$(echo "scale=4; $total_cost + $turn_cost" | bc)
            fi
        fi
    done < "$session_file"
done < <(find "$SESSIONS_DIR" -name "*.jsonl" -type f)

echo "📊 Per-Model Breakdown:"
echo ""
for model in "${!model_input[@]}"; do
    in_tok=${model_input[$model]}
    out_tok=${model_output[$model]}
    cost=${model_cost[$model]:-0}
    total_tok=$((in_tok + out_tok))
    
    echo "  $model"
    echo "    Input:  $(numfmt --grouping $in_tok) tokens"
    echo "    Output: $(numfmt --grouping $out_tok) tokens"
    echo "    Total:  $(numfmt --grouping $total_tok) tokens"
    printf "    Cost:   \$%.4f\n" "$cost"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total:"
echo "  Input:  $(numfmt --grouping $total_input_tokens) tokens"
echo "  Output: $(numfmt --grouping $total_output_tokens) tokens"
echo "  Total:  $(numfmt --grouping $((total_input_tokens + total_output_tokens))) tokens"
printf "  Cost:   \$%.4f\n" "$total_cost"
