import classnames from 'classnames';
import { OverlayTrigger } from 'react-bootstrap';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { TipIcon } from '../../../../assets/images/TipIcon';
import {
    CurrencyInfo,
    Blur,
    DepositCrypto,
    TabPanel,
    Tooltip,
} from '../../../../components';
import {
    Wallet,
    Currency,
    selectWallets,
    selectCurrencies,
    walletsAddressFetch,
    alertPush,
} from '../../../../modules';
import { WalletHistory } from '../../History';

interface DepositCryptoProps {
    selectedWalletIndex: number;
    isAccountActivated: boolean;
}

const defaultWallet: Wallet = {
    name: '',
    currency: '',
    balance: '',
    type: 'coin',
    fixed: 0,
    fee: 0,
    account_type: '',
};

export const DepositCryptoContainer = React.memo((props: DepositCryptoProps) => {
    const {
        selectedWalletIndex,
        isAccountActivated,
    } = props;

    const { formatMessage } = useIntl();

    const history = useHistory();
    const dispatch = useDispatch();

    const wallets: Wallet[] = useSelector(selectWallets);
    const currencies: Currency[] = useSelector(selectCurrencies);

    const wallet: Wallet = (wallets[selectedWalletIndex] || defaultWallet);
    const currencyItem: Currency | any = (currencies && currencies.find(item => item.id === wallet.currency)) || { min_confirmations: 6, deposit_enabled: false };

    const [tab, setTab] = useState('');
    const [currentTabIndex, setCurrentTabIndex] = useState(0);

    useEffect(() => {
        setTab(currencyItem.blockchain_currencies[0]?.blockchain_key.toUpperCase());
    }, [wallet])

    const depositAddress = wallet.deposit_addresses.find(address => address.blockchain_key?.toLowerCase() === tab.toLowerCase())

    const translate = useCallback((id: string) => formatMessage({ id }), [formatMessage]);

    const text = formatMessage({ id: 'page.body.wallets.tabs.deposit.ccy.message.submit' },
                                                   { confirmations: currencyItem.min_confirmations });
        const error = translate('page.body.wallets.tabs.deposit.ccy.message.pending');
        const blurCryptoClassName = classnames('pg-blur-deposit-crypto', {
            'pg-blur-deposit-crypto--active': isAccountActivated,
        });

        const buttonLabel = `${translate('page.body.wallets.tabs.deposit.ccy.button.generate')} ${wallet.currency.toUpperCase()} ${translate('page.body.wallets.tabs.deposit.ccy.button.address')}`;

    const handleGenerateAddress = useEffect(() => {    
            if (!depositAddress && wallets.length && wallet.type !== 'fiat') {
                dispatch(walletsAddressFetch({ currency: wallets[selectedWalletIndex].currency, blockchain_key: tab }));
            }
        }, [selectedWalletIndex, wallets, walletsAddressFetch, tab]);

    const handleOnCopy = () => dispatch(alertPush({ message: ['page.body.wallets.tabs.deposit.ccy.message.success'], type: 'success'}));

    const onTabChange = label => setTab(label);

    const onCurrentTabChange = index => setCurrentTabIndex(index);

    const renderTabs = () => {
        return currencyItem.blockchain_currencies?.map(network => {
            return {
                content: tab === network.blockchain_key?.toUpperCase() ?
                    <DepositCrypto
                        buttonLabel={buttonLabel}
                        copiableTextFieldText={translate('page.body.wallets.tabs.deposit.ccy.message.address')}
                        copyButtonText={translate('page.body.wallets.tabs.deposit.ccy.message.button')}
                        error={error}
                        handleGenerateAddress={() => handleGenerateAddress}
                        handleOnCopy={handleOnCopy}
                        text={text}
                        wallet={wallet}
                        network={tab}
                    /> : null,
                label: network.blockchain_key?.toUpperCase(),
            };
        })
    }

    return (
        <React.Fragment>
            <CurrencyInfo
                wallet={wallets[selectedWalletIndex]}
                handleClickTransfer={currency => history.push(`/wallets/transfer/${currency}`)}
            />
            {currencyItem && !currencyItem.deposit_enabled ? (
                <Blur
                    className={blurCryptoClassName}
                    text={translate('page.body.wallets.tabs.deposit.disabled.message')}
                />
            ) : null}
            <div className="cr-deposit-crypto-tabs">
                <h3>{translate('page.body.wallets.tabs.deposit.ccy.details')}</h3>
                <div className="cr-deposit-crypto-tabs__card">
                    <div className="cr-deposit-crypto-tabs__card-title">
                        <h5>{translate('page.body.wallets.tabs.deposit.ccy.blockchain.networks')}</h5>
                        <OverlayTrigger
                            placement="right"
                            delay={{ show: 250, hide: 300 }}
                            overlay={<Tooltip title="page.body.wallets.tabs.deposit.ccy.tip" />}>
                            <div className="cr-deposit-crypto-tabs__card-title-tip">
                                <TipIcon />
                            </div>
                        </OverlayTrigger>
                    </div>
                    <TabPanel
                        panels={renderTabs()}
                        onTabChange={(_, label) => onTabChange(label)}
                        currentTabIndex={currentTabIndex}
                        onCurrentTabChange={onCurrentTabChange}
                    />
                </div>
            </div>
            {wallet.currency && <WalletHistory label="deposit" type="deposits" currency={wallet.currency} />}
        </React.Fragment>
    );
});